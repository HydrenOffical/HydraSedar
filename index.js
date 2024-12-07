const axios = require('axios');
const configFile = require('./config.json'); // Ensure your config.json file has the necessary information

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
                return response.data; // Return the data if it's valid
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

        // Sanitize the path to remove trailing period (if present)

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
                    
                    // If the file is a directory and not editable, recurse into it
                    if (file.isDirectory && !file.isEditable) {
                        await getInstanceFiles(id, file.name); // Recurse into the subdirectory
                    }

                    // If the file is editable, skip it
                    if (file.isEditable) {
                        continue;
                    }

                    const fileName = file.purpose.trim();  // Trim any leading/trailing spaces
                    if (fileName === 'script') {
                        console.log(`File ${fileName} has extension .sh Suspending the server...`);
                        await suspendServer(id); // Call suspendServer function
                    }          
                }
            } else {
                console.error('The "files" field is missing or not an array.');
            }
        } else {
            console.error(`Failed to retrieve files for instance with ID: ${id} at path: ${sanitizedPath}. Status: ${response.status}`);
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


setInterval(async () => {
    console.log("Running processAllInstances...");
    await processAllInstances();
}, 15000); // 15 seconds
