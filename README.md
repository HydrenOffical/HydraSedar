<p align="center"><img src="https://github.com/user-attachments/assets/19c7e3f8-320f-4cdb-a717-7aab51b32bfb"></img>
</p>

# How to install HydraSedar

- **Clone the Repo via git**
  ```sh
  git clone https://github.com/HydrenOffical/HydrenSedar.git
  ```
- **Recurse inside the directory**
  ```bash
  cd HydrenSedar
  ```
- **Install Dependencies**
  ```npm
  npm install
  ```
- **Configure the config file**
- Rename config_example.json to config.json and change the hydra.url to your panel url and get the hydra.key from  Application Api on your panel
- On Node.url set the address:port or the url where is your daemon is hosted must include port and to get the key check the config.json file of your daemon directory u will find it there
- Add your discord webhook to send the notifications of Suspended Server
   
- **Start Sedar**
  ```bash
  node index.js
  ```

# Whats Sedar ?

 **Sedar Stop Abusers to mine or run specious files like .sh .bash on HydrenPanel**
 ## Features
-  Checks specious files like .sh , .iso , and .wsf
-  Checks that does server.jar or anyother jar have specious Size and Feature in that jar file
- Checks that if there a Server Running Whatsapp bot 
- Checks that if anyone is mining crypto

# What if anyone is abusing?
- If he/she is abusing, His/Her instance will be suspended and Discord Webhook will send a notification About 
- Server Id
- Reason


