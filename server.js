const http = require('http');
const { connectDB } = require('./config/db');
const { connectNeo4j } = require('./config/neo4j');
const { createApp } = require('./app');
const config = require('./config/env');

async function start(){
    await connectDB();
    try {
        await connectNeo4j();
    } catch (e) {
        console.error('Neo4j connection error:', e.message);
    }
    
    const app = createApp();
    const server = http.createServer(app);
    
    server.listen(config.port, ()=>{
        console.log(`Server running on Port ${config.port}`);
    });
}

start();
