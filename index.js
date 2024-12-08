const axios = require('axios');
const configFile = require('./config.json'); // Ensure your config.json file has the necessary information

const SCAN_INTERVAL = 3 * 60 * 1000;

// Function to suspend a server
async function suspendServer(id) {
    try {
        const baseUrl = configFile.hydra.url;
        if (!baseUrl) {
            console.error('Base URL is missing in the config');
            return []; // Return empty array if the URL is missing
        }

        // Create the full URL for the API request
        const url = `${baseUrl}/api/instances/suspend?key=${configFile.hydra.key}&id=${id}`;

        const response = await axios.get(url);
        
        if (response.status === 200) {
            console.log(`Server with ID: ${id} has been suspended successfully.`);
        } else {
            console.error(`Failed to suspend server with ID: ${id}. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error suspending server with ID: ${id}.`, error.message);
    }
}

// Function to unsuspend a server
async function unsuspendServer(id) {
    try {
        const response = await axios.post(`http://${configFile.hydra.url}/api/instances/unsuspend/${id}?key=${configFile.hydra.key}`);
        if (response.status === 200) {
            console.log(`Server with ID: ${id} has been unsuspended successfully.`);
        } else {
            console.error(`Failed to unsuspend server with ID: ${id}. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error unsuspending server with ID: ${id}.`, error.message);
    }
}

async function sendPublicAlert(serverId, reason) {
    const message = {
        embeds: [{
          title: "Suspicious activity detected by Sedar.",
          color: 0x5046e4,
          fields: [
            {
            name: "Container",
            value: serverId || "Unknown",
            inline: false
          },
          {
            name: "Reason",
            value: reason || "Unknown",
          }
        ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Powered by Sedar 1'
          }
        }]
      };      
  
    try {
      await axios.post(configFile.discord.webhook, message);
      console.log(`Sent public alert for container ${serverId}`);
    } catch (error) {
      console.error(`Error sending public alert for container ${serverId}:`, error);
    }
  }
  // Function to get all instances
async function getInstances() {
    try {
        const baseUrl = configFile.hydra.url;
        if (!baseUrl) {
            console.error('Base URL is missing in the config');
            return []; // Return empty array if the URL is missing
        }

        // Create the full URL for the API request
        const url = `${baseUrl}/api/instances?key=${configFile.hydra.key}`;

        const response = await axios.get(url);
        
        // Check if the response is valid
        if (response.status === 200) {
            if (response.data) {
                // Filter out suspended instances
                const activeInstances = response.data.filter(instance => !instance.suspended);

                return activeInstances; // Return only active instances
            } else {
                console.error('No data received in response');
                return []; // Return an empty array if no data is returned
            }
        } else {
            console.error(`Failed to retrieve instances. Status: ${response.status}`);
            return []; // Return an empty array on failure
        }
    } catch (error) {
        console.error('Error retrieving instances:', error.message);
        return []; // Return an empty array in case of an error
    }
}


// Function to get files from a specific instance
async function getInstanceFiles(id, path) {
    try {
        const baseUrl = configFile.node.url;
        if (!baseUrl) {
            console.error('Base URL is missing in the config');
            return []; // Return empty array if the URL is missing
        }

        const url = `${baseUrl}/fs/${id}/files?path=${path}`;
        const response = await axios.get(url, {
            auth: {
                username: 'Skyport',
                password: configFile.node.key
            }
        });

        if (response.status === 200) {
            const files = response.data.files;
             
            if (Array.isArray(files)) {
                // Loop through each file in the directory
                for (const file of files) {
                    console.log(`File: ${file.name} Extension: ${file.extension} Purpose : ${file.purpose}`)
                    // If the file is a directory and not editable, recurse into it
                    if (file.isDirectory && !file.isEditable) {
                        await getInstanceFiles(id, file.name); // Recurse into the subdirectory
                    }

                    // If the file has the purpose 'script', suspend the server and send alert
                    if (file.purpose === 'script') {
                        await suspendServer(id); // Suspend the server
                        await sendPublicAlert(id, 'Detected a specious .sh File'); // Send the public alert
                    }

                    if (file.name === 'server.jar') {
                        // Parse and convert file size to bytes
                        let sizeInBytes;
                        if (file.size.includes('MB')) {
                            sizeInBytes = parseFloat(file.size) * 1024 * 1024; // Convert MB to bytes
                        } else if (file.size.includes('KB')) {
                            sizeInBytes = parseFloat(file.size) * 1024; // Convert KB to bytes
                        } else if (file.size.includes('B')) {
                            sizeInBytes = parseFloat(file.size); // Already in bytes
                        } else {
                            console.error('Unknown size format:', file.size);
                            return; // Exit if size format is unsupported
                        }
                    
                        // Check if the file size is less than 18 MB
                        if (sizeInBytes < 18 * 1024 * 1024) {
                            await suspendServer(id); // Suspend the server
                            await sendPublicAlert(id, 'Detected a specious server.jar file'); // Send the public alert
                        }
                    }
                                  

                    // If the file is editable, skip it
                    if (file.isEditable) {
                        continue;
                    }
                }
            } else {
                console.error('The "files" field is missing or not an array.');
            }
        } else {
            console.error(`Failed to retrieve files for instance with ID: ${id} at path: ${path}. Status: ${response.status}`);
        }
    } catch (error) {
    }
}


// Function to get the content of a specific file
async function getInstanceFileContent(id, path, filename) {
    try {
        const response = await axios.get(`http://${configFile.node.url}/fs/${id}/files/view/${filename}?path=${path}`, {
            auth: {
                username: 'Skyport',
                password: configFile.node.key
            }
        });
        if (response.status === 200) {
            console.log(`File content for ${filename} at path ${path}:`);
            console.log(response.data.content); // Display the file content
            return response.data.content; // This will return the content of the file
        } else {
            console.error(`Failed to retrieve file content for ${filename} at path ${path}. Status: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error retrieving file content for ${filename} at path ${path}.`, error.message);
    }
}

// Function to fetch all instances and process them
async function processAllInstances() {
    try {
        const instances = await getInstances(); // Get all instances

        for (const instance of instances) {
            const id = instance.Id; // Assuming the ID is stored in 'Id' field
            console.log(`Processing instance with ID: ${id}`); // Corrected log format

            // Start by checking the root directory
            await getInstanceFiles(id, ''); // Pass empty string to check root directory
        }
    } catch (error) {
        console.error('Error processing instances:', error.message); // Log any errors that occur
    }
}


// Main Execution
async function main() {
  console.log('Starting continuous container abuse detection...');
  
  while (true) {
    try {
      await processAllInstances();
      console.log(`Completed scan. Waiting ${SCAN_INTERVAL / 1000} seconds before next scan...`);
    } catch (error) {
      console.error('Error in scan cycle:', error);
    } finally {
      await new Promise(resolve => setTimeout(resolve, SCAN_INTERVAL));
    }
  }
}

main().catch(error => console.error('Error in anti-abuse script:', error));