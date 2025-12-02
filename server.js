const http = require('http');
const { connectDB } = require('./config/db');
const { createApp } = require('./app');
const config = require('./config/env');

async function start(){
    await connectDB();
    
    const app = createApp();
    const server = http.createServer(app);
    
    server.listen(config.port, ()=>{
        console.log(`Server running on Port ${config.port}`);
    });
}

start();
