const { getSession } = require('../config/neo4j');
const User = require('../models/User');

function mapNodeToPathway(node, rank) {
  const props = node.properties || {};
  const id = props.id || node.elementId || String(node.identity);
  return {
    id,
    title: props.title || props.name || 'Untitled Pathway',
    description: props.description || '',
    duration: props.total_hours ? `${props.total_hours} hours` : props.duration || 'N/A',
    nsqfLevel: Number(props.nsqfLevel || 0),
    sector: props.sector || 'General',
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

module.exports = { getRecommendations };
