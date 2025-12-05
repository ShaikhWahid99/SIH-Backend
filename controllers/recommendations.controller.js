const { getSession } = require('../config/neo4j');
const User = require('../models/User');

function mapNodeToPathway(node, rank) {
  const props = node.properties || {};
  const id = props.id || node.elementId || String(node.identity);

  // Helper for Neo4j integers
  const getInt = (val) => {
    if (!val) return 0;
    if (val.low !== undefined && val.high !== undefined) return val.toNumber();
    return Number(val);
  };

return {
    id,
    title: props.title || props.name || 'Untitled Pathway',
    nqrCode: props.nqr_code || props.nqrCode || '',
    description: props.description || '',
    duration: props.total_hours ? `${props.total_hours} hours` : props.duration || 'N/A',
    nsqfLevel: getInt(props.nsqfLevel || props.level || props.nsqf_level || props.Level),
    
    // EXISTING: Ensure this is here
    sector: props.sector || 'General',
    
    // NEW: Add valid_till mapping
    validTill: props.valid_till || props.validTill || 'N/A', 
    
    tags: Array.isArray(props.tags) ? props.tags : [],
    skillDemand: rank != null ? `Rank ${rank}` : props.skillDemand || undefined,
  };
}

async function getRecommendations(req, res) {
  let session;
  try {
    const userId = req.userId;
    const user = await User.findById(userId).lean();
    session = getSession();

    const queries = [
      {
        text:
          'MATCH (u:User {mongoId:$userId})-[r:RECOMMENDED_FOR]->(q:Qualification) RETURN q, r.rank AS rank ORDER BY rank ASC',
        params: { userId },
      },
      {
        text:
          'MATCH (u:User {id:$userId})-[r:RECOMMENDED_FOR]->(q:Qualification) RETURN q, r.rank AS rank ORDER BY rank ASC',
        params: { userId },
      },
      user?.email
        ? {
            text:
              'MATCH (u:User {email:$email})-[r:RECOMMENDED_FOR]->(q:Qualification) RETURN q, r.rank AS rank ORDER BY rank ASC',
            params: { email: user.email },
          }
        : null,
    ].filter(Boolean);

    let records = [];
    for (const q of queries) {
      const result = await session.run(q.text, q.params);
      if (result.records.length) {
        records = result.records;
        break;
      }
    }

    const pathways = records.map((r) => {
      const q = r.get('q');
      const rank = r.get('rank');
      return mapNodeToPathway(q, rank);
    });
    return res.json({ items: pathways });
  } catch (err) {
    console.error('getRecommendations error:', err);
    return res.status(500).json({ message: 'Failed to fetch recommendations' });
  } finally {
    if (session) await session.close();
  }
}

async function getPathwayById(req, res) {
  let session;
  try {
    const { id } = req.params;
    session = getSession();

    // Query to find the node by its Element ID (handles both modern 4:xxx IDs and older Integer IDs)
    const query = `
      MATCH (q:Qualification)
      WHERE elementId(q) = $id OR ID(q) = toInteger($id)
      RETURN q
    `;

    const result = await session.run(query, { id });

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Pathway not found' });
    }

    const record = result.records[0];
    const node = record.get('q');
    
    // Use your existing mapper, but rank is null here since it's a direct fetch
    const pathway = mapNodeToPathway(node, null);
    
    // Add extra details if they exist in the graph (like Job Roles or Steps)
    // For now, we return the base node to get the page working.
    return res.json(pathway);
  } catch (err) {
    console.error('getPathwayById error:', err);
    return res.status(500).json({ message: 'Failed to fetch pathway details' });
  } finally {
    if (session) await session.close();
  }
}

// ... existing imports and functions ...

async function getPathwayGraph(req, res) {
  let session;
  try {
    const { id } = req.params;
    session = getSession();

    // Query: Find the Qualification by ID, then find all connected Modules
    const query = `
      MATCH (q:Qualification)-[:HAS_MODULE]->(m)
      WHERE elementId(q) = $id OR ID(q) = toInteger($id)
      RETURN q, m
    `;

    const result = await session.run(query, { id });

    // Transform Neo4j data into a standard Graph format (Nodes & Links)
    const nodes = new Map();
    const links = [];

    result.records.forEach((record) => {
      const q = record.get('q');
      const m = record.get('m');

      // 1. Process Root Node (Qualification)
      const qId = q.elementId || String(q.identity);
      if (!nodes.has(qId)) {
        nodes.set(qId, {
          id: qId,
          label: q.properties.title || 'Qualification',
          type: 'root', // specialized type for styling
          ...q.properties
        });
      }

      // 2. Process Child Node (Module)
      const mId = m.elementId || String(m.identity);
      if (!nodes.has(mId)) {
        nodes.set(mId, {
          id: mId,
          label: m.properties.title || m.properties.name || 'Module',
          type: 'module',
          ...m.properties
        });
      }

      // 3. Create Link
      links.push({
        source: qId,
        target: mId
      });
    });

    return res.json({
      nodes: Array.from(nodes.values()),
      links: links
    });

  } catch (err) {
    console.error('getPathwayGraph error:', err);
    return res.status(500).json({ message: 'Failed to fetch graph data' });
  } finally {
    if (session) await session.close();
  }
}

module.exports = { getRecommendations, getPathwayById, getPathwayGraph };
