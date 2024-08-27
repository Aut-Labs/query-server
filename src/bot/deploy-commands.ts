// import { REST, Routes } from "discord.js";
// import { config } from "./config";
// import * as fs from "fs";
// import * as path from "path";

// const { clientId, guildId, token } = config.config;

// interface Command {
//   data: {
//     toJSON(): object;
//   };
//   execute: Function;
// }

// const commands: object[] = [];
// const foldersPath = path.join(__dirname, "commands");
// const commandFolders = fs.readdirSync(foldersPath);

// for (const folder of commandFolders) {
//   const commandsPath = path.join(foldersPath, folder);
//   const commandFiles = fs
//     .readdirSync(commandsPath)
//     .filter((file) => file.endsWith(".ts"));

//   for (const file of commandFiles) {
//     const filePath = path.join(commandsPath, file);
//     const command: Command = require(filePath);
//     if ("data" in command && "execute" in command) {
//       commands.push(command.data.toJSON());
//     } else {
//       console.log(
//         `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
//       );
//     }
//   }
// }

// console.log(token);
// console.log(guildId);
// console.log(clientId);

// const rest = new REST().setToken(
//   "token"
// );

// (async () => {
//   try {
//     console.log(
//       `Started refreshing ${commands.length} application (/) commands.`
//     );

//     const data = await rest.put(
//       Routes.applicationGuildCommands(
//         "1129037421615529984",
//         "1133407677091942480"
//       ),
//       { body: commands }
//     );

//     console.log(
//       `Successfully reloaded ${
//         (data as any[]).length
//       } application (/) commands.`
//     );
//   } catch (error) {
//     console.error(error);
//   }
// })();
