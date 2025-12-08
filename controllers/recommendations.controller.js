const { getSession } = require('../config/neo4j');
const User = require('../models/User');
const axios = require('axios');

// ✅ 1. SHARED HELPER: Normalizes DB properties to your Frontend keys
function mapNodeToPathway(node, rank) {
  const props = node.properties || {};
  const id = props.id || node.elementId || String(node.identity);

  // Helper for Neo4j integers
  const getInt = (val) => {
    if (!val) return 0;
    if (val.low !== undefined && val.high !== undefined) return val.toNumber();
    return Number(val);
  };

  // Duration Logic (Matches your DB keys)
  let durationStr = 'N/A';
  if (props.duration_formatted) {
    durationStr = props.duration_formatted;
  } else if (props.duration_minutes) {
    const hours = Math.floor(getInt(props.duration_minutes) / 60);
    durationStr = `${hours} hours`;
  } else if (props.total_hours) {
    durationStr = `${props.total_hours} hours`;
  }

  return {
    id,
    title: props.title || props.name || 'Untitled Pathway',

    // Check all possible code keys from your screenshot
    nqrCode: props.code || props.nqr_code || props.nos_code || '',

    description: props.description || '',
    duration: durationStr,
    nsqfLevel: getInt(props.nsqfLevel || props.nsqf_level || props.level),
    sector: props.sector || 'General',
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
        text: 'MATCH (u:User {mongoId:$userId})-[r:RECOMMENDED_FOR]->(q:Qualification) RETURN q, r.rank AS rank ORDER BY rank ASC',
        params: { userId },
      },
      {
        text: 'MATCH (u:User {id:$userId})-[r:RECOMMENDED_FOR]->(q:Qualification) RETURN q, r.rank AS rank ORDER BY rank ASC',
        params: { userId },
      },
      user?.email
        ? {
            text: 'MATCH (u:User {email:$email})-[r:RECOMMENDED_FOR]->(q:Qualification) RETURN q, r.rank AS rank ORDER BY rank ASC',
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

    const query = `
      MATCH (q:Qualification)
      WHERE elementId(q) = $id OR ID(q) = toInteger($id)
      RETURN q
    `;

    const result = await session.run(query, { id });

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Pathway not found' });
    }

    const node = result.records[0].get('q');
    // Use the updated mapper
    const pathway = mapNodeToPathway(node, null);

    return res.json(pathway);
  } catch (err) {
    console.error('getPathwayById error:', err);
    return res.status(500).json({ message: 'Failed to fetch pathway details' });
  } finally {
    if (session) await session.close();
  }
}

async function getPathwayGraph(req, res) {
  let session;
  try {
    const { id } = req.params;
    session = getSession();

    const query = `
      MATCH (q:Qualification)-[:HAS_MODULE]->(m)
      WHERE elementId(q) = $id OR ID(q) = toInteger($id)
      RETURN q, m
    `;

    const result = await session.run(query, { id });

    const nodes = new Map();
    const links = [];

    result.records.forEach((record) => {
      const q = record.get('q');
      const m = record.get('m');

      // ✅ 2. FIX: Normalize Root Node (Qualification) Properties
      const qId = q.elementId || String(q.identity);
      const qProps = q.properties;
      if (!nodes.has(qId)) {
        nodes.set(qId, {
          id: qId,
          // Use new DB keys for Title and Code
          label: qProps.title || qProps.name || 'Qualification',
          code: qProps.code || qProps.nqr_code || '',
          type: 'root',
          link: `/learner/pathways/${qId}`,
          ...qProps
        });
      }

      // ✅ 3. FIX: Normalize Child Node (Module) Properties
      const mId = m.elementId || String(m.identity);
      const mProps = m.properties;
      if (!nodes.has(mId)) {
        nodes.set(mId, {
          id: mId,
          // Use new DB keys here too
          label: mProps.title || mProps.name || 'Module',
          code: mProps.code || mProps.nqr_code || mProps.nos_code || '',
          type: 'module',
          link: `/learner/courses/${mId}`,
          ...mProps
        });
      }

      links.push({ source: qId, target: mId });
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

async function getCourseById(req, res) {
  let session;
  try {
    const { id } = req.params;
    session = getSession();

    // Query to find ANY node (Course, Module, Lab) by its ID (from friend's comment)
    const query = `
      MATCH (n)
      WHERE elementId(n) = $id OR ID(n) = toInteger($id)
      RETURN n
    `;

    const result = await session.run(query, { id });

    if (result.records.length === 0) {
      return res.status(404).json({ message: 'Course/Module not found' });
    }

    const node = result.records[0].get('n');
    const props = node.properties || {};
    const nodeId = node.elementId || String(node.identity);

    // Helper for integers
    const getInt = (val) => {
      if (!val) return 0;
      if (val.low !== undefined) return val.toNumber();
      return Number(val);
    };

    // Duration Logic
    let durationStr = 'N/A';
    if (props.duration_formatted) durationStr = props.duration_formatted;
    else if (props.duration_minutes) durationStr = `${Math.floor(getInt(props.duration_minutes) / 60)} Hours`;
    else if (props.hours) durationStr = `${props.hours} Hours`;

    // ✅ 4. FIX: Normalize Course Detail Properties
    return res.json({
      id: nodeId,
      title: props.title || props.name || 'Untitled Module',
      code: props.code || props.nqr_code || props.nos_code || '', // Explicit Code Check

      mandatory: props.mandatory || 'Optional',
      credits: props.credits ? String(props.credits) : '0',
      duration: durationStr,

      nsqfLevel: props.nsqf_level || props.nsqfLevel || props.level || 'N/A',

      description: props.description || '',
      mode: props.mode || 'Offline',
      provider: props.provider || 'Internal',
      learningOutcomes: props.learning_outcome || props.learningOutcomes || [], // Check for 'learning_outcome' from your screenshot

      ...props
    });
  } catch (err) {
    console.error('getCourseById error:', err);
    return res.status(500).json({ message: 'Failed to fetch course details' });
  } finally {
    if (session) await session.close();
  }
}

async function getRelatedVideos(req, res) {
  try {
    const { q } = req.query; // Expecting query param ?q=CourseName (from friend's comment)
    if (!q) {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    const searchQuery = q.replace(/ /g, '+');
    // Using a User-Agent to mimic a real browser to avoid simple blocking (from friend's comment)
    const response = await axios.get(`https://www.youtube.com/results?search_query=${searchQuery}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
      }
    });

    // Extract JSON data from the HTML (from friend's comment)
    const html = response.data;
    const match = html.match(/var ytInitialData = ({.*?});/);
    if (!match) return res.json([]);

    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

    const videos = [];
    if (contents) {
      for (const section of contents) {
        const items = section.itemSectionRenderer?.contents;
        if (items) {
          for (const item of items) {
            if (item.videoRenderer) {
              const v = item.videoRenderer;
              videos.push({
                title: v.title?.runs[0]?.text || 'No Title',
                videoId: v.videoId,
                url: `https://www.youtube.com/watch?v=${v.videoId}`,
                thumbnail: v.thumbnail?.thumbnails[0]?.url || '',
                views: v.viewCountText?.simpleText || 'N/A'
              });

              if (videos.length >= 3) break; // Limit to 3 videos (from friend's comment)
            }
          }
        }
        if (videos.length >= 3) break;
      }
    }
    return res.json(videos);
  } catch (err) {
    console.error('getRelatedVideos error:', err.message);
    // Return empty array on failure so frontend doesn't crash (from friend's comment)
    return res.json([]);
  }
}

// ✅ NEW FUNCTION: Skill India Similarity Search
async function getSkillIndiaSimilarCourses(req, res) {
  let session;
  try {
    const { id } = req.params; // Qualification ID (not title, for safety)
    session = getSession();

    // Uses the Qualification's embedding to find similar SkillIndiaCourses
    const query = `
      MATCH (q:Qualification)
      WHERE elementId(q) = $id OR ID(q) = toInteger($id)
      WITH q.embedding AS embedding
      MATCH (n:SkillIndiaCourse)
      WHERE n.embedding IS NOT NULL AND size(n.embedding) > 0
      WITH n, embedding, vector.similarity.cosine(embedding, n.embedding) AS similarity
      ORDER BY similarity DESC
      RETURN n, similarity
      LIMIT 4
    `;

    const result = await session.run(query, { id });
    
    const courses = result.records.map(record => {
      const node = record.get('n');
      const props = node.properties;
      const id = node.elementId || String(node.identity);
      
      // Map Skill India Nodes to CourseCard Format
      return {
        id: id,
        title: props.title || 'Unknown Course',
        provider: props.created_by || 'Skill India',
        duration: props.duration_formatted || `${props.duration_minutes || 0} mins`,
        mode: props.type || 'Online', // "Paid" in DB, usually implies Online/Hybrid
        nsqfLevel: props.nsqf_level || 'N/A', // Mapped from DB
        description: props.long_description || props.description || props.learning_outcome || '',
        isExternal: true, // Flag for frontend
        externalLink: props.course_link || '#'
      };
    });

    return res.json(courses);

  } catch (err) {
    console.error('getSkillIndiaSimilarCourses error:', err);
    return res.status(500).json({ message: 'Failed to fetch similar courses' });
  } finally {
    if (session) await session.close();
  }
}

async function getAllSkillIndiaCourses(req, res) {
  let session;
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    session = getSession();

    // Basic search query
    const whereClause = search 
      ? `WHERE toLower(n.title) CONTAINS toLower($search) OR toLower(n.description) CONTAINS toLower($search)`
      : '';

    const query = `
      MATCH (n:SkillIndiaCourse)
      ${whereClause}
      RETURN n
      SKIP toInteger($skip)
      LIMIT toInteger($limit)
    `;

    const result = await session.run(query, { skip, limit, search });

    const courses = result.records.map(record => {
      const node = record.get('n');
      const props = node.properties;
      const id = node.elementId || String(node.identity);
      
      return {
        id: id,
        title: props.title || 'Unknown Course',
        provider: props.created_by || 'Skill India',
        duration: props.duration_formatted || `${props.duration_minutes || 0} mins`,
        mode: props.type || 'Online', 
        nsqfLevel: props.nsqf_level || 'N/A',
        description: props.long_description || props.description || '',
        isExternal: true,
        externalLink: props.course_link || '#'
      };
    });

    return res.json(courses);
  } catch (err) {
    console.error('getAllSkillIndiaCourses error:', err);
    return res.status(500).json({ message: 'Failed to fetch courses' });
  } finally {
    if (session) await session.close();
  }
}

module.exports = { 
  getRecommendations, 
  getPathwayById, 
  getPathwayGraph, 
  getCourseById, 
  getRelatedVideos,
  getSkillIndiaSimilarCourses,
  getAllSkillIndiaCourses
};