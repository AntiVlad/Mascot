const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const schedule = require('node-schedule');
const fixtures = require('./fixtures.json');
const { Case } = require('change-case-all');

const client = new Client({
    authStrategy: new LocalAuth(),
     webVersion: "2.2412.54",
     webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    puppeteer: { headless: true },
    ffmpegPath: '../ffmpeg.exe',
    puppeteer: {headless: true,
        args: ['--no-sandbox'],
        executablePath:'/usr/bin/google-chrome-stable'
    }
});
// const client = new Client({
//     authStrategy: new LocalAuth(),
//     webVersion: "2.2412.54",
//      webVersionCache: {
//         type: "remote",
//         remotePath:
//           "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
//       },
//     ffmpegPath: '../ffmpeg.exe',
//     puppeteer: {
//       executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//       headless: true
//   }
// });
client.initialize();


client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

function addCommas(str) {
  return str.replace(/\s+/g, ', ');
}

let mapss = [ 'Haven', 'Icebox', 'Breeze', 'Fracture', 'Sunset', 'Pearl', 'Lotus'];
let servers = ['Paris', 'London', 'Frankfurt'];
let sides = ['Attack', 'Defence', 'Defense'];

let vetoState = {
  maps: mapss.map(map => map.toLowerCase()),
  servers: servers.map(server => server.toLowerCase()),
  sides: sides.map(side => side.toLowerCase()),
  started: false,
  mapSelectionPhase: false,
  serverSelectionPhase: false,
  sideSelectionPhase: false,
  mapSelected: '',
  serverSelected: '',
  sideSelected: '',
  homeTeam: '',
  awayTeam: ''
};

async function handleVeto(msg, vetoState) {
  try {
      const chat = await client.getChatById(msg.from);

      const vetoCommand = msg.body.toLowerCase();

      if (vetoState.started && vetoCommand.startsWith('ban')) {
          const mapToBan = vetoCommand.substring(4).trim();
          if (vetoState.maps.includes(mapToBan)) {
              vetoState.maps = vetoState.maps.filter(map => map !== mapToBan);
              await msg.reply(`*${Case.capital(mapToBan)}* has been banned.`);

              if (vetoState.maps.length === 3) {
                  vetoState.started = false;
                  vetoState.mapSelectionPhase = true;
                  await msg.reply(`Remaining maps: ${addCommas(Case.capital(vetoState.maps.join(', ')))}
*${vetoState.homeTeam}* will now pick one of these remaining maps by using the format "pick <map>".`);
              }
          } else {
              await msg.reply(`${Case.capital(mapToBan)} is not available for banning.`);
          }
      } else if (vetoState.mapSelectionPhase && vetoCommand.startsWith('pick')) {
          const mapToSelect = vetoCommand.substring(5).trim();
          if (vetoState.maps.includes(mapToSelect)) {
              vetoState.mapSelected = mapToSelect;
              vetoState.mapSelectionPhase = false;
              vetoState.serverSelectionPhase = true;
              await msg.reply(`*${Case.capital(mapToSelect)}* has been picked by *${vetoState.homeTeam}*.`);
              await chat.sendMessage(`*${vetoState.homeTeam}* Please pick a server from the following options: ${servers.join(', ')} by using the format "pick <server>".`);
          } else {
              await msg.reply(`*${Case.capital(mapToSelect)}* is not available for selection.`);
          }
      } else if (vetoState.serverSelectionPhase && vetoCommand.startsWith('pick')) {
          const serverToSelect = vetoCommand.substring(5).trim();
          if (vetoState.servers.includes(serverToSelect)) {
              vetoState.serverSelected = serverToSelect;
              vetoState.serverSelectionPhase = false;
              vetoState.sideSelectionPhase = true;
              await msg.reply(`*${Case.capital(serverToSelect)}* has been picked by *${vetoState.homeTeam}*.`);
              await chat.sendMessage(`*${vetoState.awayTeam}* Please pick a starting side (Attack or Defence) by using the format "pick <side>".`);
          } else {
              await msg.reply(`${Case.capital(serverToSelect)} is not available.`);
          }
      } else if (vetoState.sideSelectionPhase && vetoCommand.startsWith('pick')) {
          const sideToSelect = vetoCommand.substring(5).trim();
          if (vetoState.sides.includes(sideToSelect)) {
              vetoState.sideSelected = sideToSelect;
              vetoState.sideSelectionPhase = false;
              await msg.reply(`*${Case.capital(sideToSelect)}* has been picked by ${vetoState.awayTeam}.`);
              await msg.reply(`*Map:* ${Case.capital(vetoState.mapSelected)}.
*Server:* ${Case.capital(vetoState.serverSelected)}.
*${vetoState.awayTeam}'s starting side:* ${Case.capital(vetoState.sideSelected)}.`);
          } else {
              await msg.reply(`Starting side "${Case.capital(sideToSelect)}" is not available.`);
          }
      } else {
          await msg.reply(`Invalid command. Please use the correct format.`);
      }
  } catch (error) {
      console.error('Error in handleVeto function:', error);
  }
}

client.on('message', async msg => {
  if (msg.fromMe) {
      return;
  }

  if (vetoState.started || vetoState.mapSelectionPhase || vetoState.serverSelectionPhase || vetoState.sideSelectionPhase) {
      await handleVeto(msg, vetoState);
  }
});

// Schedule the main veto process for each match
fixtures.forEach(fixture => {
  const matchTime = new Date(fixture.matchTime);
  matchTime.setHours(matchTime.getHours() - 1);

  schedule.scheduleJob(matchTime, async function() {
      try {
          vetoState.maps = mapss.map(map => map.toLowerCase());
          vetoState.mapSelected = '';
          vetoState.serverSelected = '';
          vetoState.sideSelected = '';
          vetoState.started = true;
          vetoState.mapSelectionPhase = false;
          vetoState.serverSelectionPhase = false;
          vetoState.sideSelectionPhase = false;
          vetoState.homeTeam = fixture.teams[0];
          vetoState.awayTeam = fixture.teams[1];

          const chat = await client.getChatById(fixture.chatId);
          await chat.sendMessage(`*It's time to Ban maps for ${fixture.teams[0]} vs ${fixture.teams[1]}*
Maps available are the 7 listed below.

Haven 
Icebox
Fracture
Sunset
Pearl
Lotus
Breeze

${fixture.teams[0]} Ban First.
`);
      } catch (error) {
          console.error('Error scheduling match message:', error);
      }
  });
});

// Schedule a daily notification for upcoming vetos
schedule.scheduleJob('0 10 * * 5,6,0', async function() { 
  try {
      const today = new Date().toISOString().split('T')[0];
      const upcomingFixtures = fixtures.filter(fixture => fixture.matchTime.startsWith(today));

      if (upcomingFixtures.length > 0) {
          let summaryMessage = '*Today\'s Vetos:*\n';
          upcomingFixtures.forEach(fixture => {
              const matchTime = new Date(fixture.matchTime);
              summaryMessage += `\n*${fixture.teams[0]} vs ${fixture.teams[1]}* at ${matchTime.toLocaleTimeString()}`;
          });

          const chatId = '120363145135309296@g.us'; //******** 
          const chat = await client.getChatById(chatId);
          await chat.sendMessage(`${summaryMessage}

*BE THERE 🫵🏿*`);
      }
  } catch (error) {
      console.error('Error scheduling daily notification:', error);
  }
});

client.on('message', async (msg) => {
  if (msg.body === '...') {
      console.log(msg.id);
  }
});