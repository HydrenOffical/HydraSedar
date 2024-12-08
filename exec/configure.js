const fs = require('fs');
const path = require('path');

// Get the arguments from the command line
const args = process.argv.slice(2);

// Initialize configuration object
const config = {
    hydra: { url: "", key: "" },
    node: { url: "", key: "" },
    discord: { webhook: "" }
};

// Helper function to parse arguments
function parseArgs() {
    args.forEach(arg => {
        if (arg.startsWith('--webhook=')) {
            config.discord.webhook = arg.split('=')[1];
        } else if (arg.startsWith('--hydraUrl=')) {
            config.hydra.url = arg.split('=')[1];
        } else if (arg.startsWith('--hydraKey=')) {
            config.hydra.key = arg.split('=')[1];
        } else if (arg.startsWith('--nodeAddress=')) {
            const nodeUrl = arg.split('=')[1];
            const nodePortArg = args.find(arg => arg.startsWith('--nodePort='));
            const nodePort = nodePortArg ? nodePortArg.split('=')[1] : '';
            config.node.url = nodeUrl + (nodePort ? `:${nodePort}` : '');
        } else if (arg.startsWith('--nodeKey=')) {
            config.node.key = arg.split('=')[1];
        }
    });
}

// Execute the parsing function
parseArgs();

// Define the target path for the config file
const targetPath = path.resolve(__dirname, '../config.json');

// Write the config object to the file
fs.writeFile(targetPath, JSON.stringify(config, null, 2), (err) => {
    if (err) {
        console.error('Error creating config.json:', err.message);
        process.exit(1);
    }
    console.log(`Config file successfully created at ${targetPath}`);
});
