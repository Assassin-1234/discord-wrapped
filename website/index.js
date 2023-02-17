const express = require('express');
const fileUpload = require('express-fileupload');
const childProcess = require('child_process');
const path = require('path');
const unzipper = require('unzipper');
const fs = require('fs');

const app = express();
const PORT = 3000;

let alreadyRunning = false;

// Middleware for file upload
app.use(fileUpload());

// Serve the index page
app.get('/', (req, res) => {
	res.send(`
    <html>
      <head>
        <title>Discord Wrapped</title>
      </style>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
        <script async defer src="https://buttons.github.io/buttons.js"></script>
        <script src="https://apis.google.com/js/platform.js"></script>


		<style>
		body {
		  display: flex;
		  justify-content: center;
		  align-items: center;
		  height: 100vh;
		  margin: 0;
		}
  
		.container {
			background-color: rgba(255, 255, 255, 0.7);
			position: relative;
			margin: 0 auto;
			width: 50%;
			text-align: center;
		  }
  
		.bg-image {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: -1;
			filter: blur(8px);
			background-image: url('https://media.discordapp.net/attachments/1074408238939906220/1076099186862334033/2023-02-17_13-12-transformed.png');
			background-repeat: no-repeat;
			background-position: center center;
			background-size: cover;
			transform: scale(1.2);
		  }
	  </style>
      </head>
      <body>
	  <div class="bg-image"></div>
        <div class="container">
          <h1 class="my-5">Discord Wrapped</h1>
          <form method="post" enctype="multipart/form-data">
            <div class="form-group">
              <label for="file">Please select your Discord Data Package in ZIP format:</label>
			  <div class='text-center'>
			  <div class="container" style="display: flex; justify-content: center;width: 233px">

              <input type="file" name="file" class="form-control-file mx-auto">
			  </div>
			  </div>
            </div>
            <button onclick='showSpinner()' type="submit" class="btn btn-primary">Upload and Unzip</button>
          </form>
          <a href="https://twitter.com/intent/tweet" class="twitter-mention-button" data-size="large" data-text="This is my #DiscordWrapped! Get your own: https://discordwrapped.xyz [Delete this placeholder and drag your MP4 file in here]" data-related="" data-show-count="false">Share on Twitter</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
          <a class="github-button" href="https://github.com/Assassin-1234/discord-wrapped" data-color-scheme="no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star Assassin-1234/discord-wrapped on GitHub">Star</a>
          <br>
      </button>
        <script>
            function showSpinner(){
                const img = document.createElement('img');
                
                img.src = 'https://media.tenor.com/xdnqVxS6wu4AAAAM/bored-fidget-spinner.gif';

                const container = document.querySelector('.container');
                container.appendChild(img);
            }
        </script>
      </body>
    </html>
  `);
});

// Handle file upload
app.post('/', async (req, res) => {
	const file = req?.files?.file;

	if(alreadyRunning) return res.status(403).send('Someone is already generating a Discord Wrapped, stand by!');
	if(!file) return res.status(404).send('Please provide the file.');
	// Check if file is a zip file
	if (path.extname(file.name) !== '.zip') {
		return res.status(400).send('File must be a zip file');
	}
	alreadyRunning = true;
	// Unzip file
	const zipFilePath = path.join(__dirname, file.name);
	await file.mv(zipFilePath);

	fs.createReadStream(zipFilePath)
		.pipe(unzipper.Extract({ path: './package' }))
		.on('close', () => {
			// Run another Node.js script
			const child = childProcess.spawn('node', ['../index.js']);

			child.stdout.on('data', (data) => {
				console.log(`stdout: ${data}`);
			});

			child.stderr.on('data', (data) => {
				console.error(`stderr: ${data}`);
			});

			child.on('close', (code) => {
				console.log(`child process exited with code ${code}`);
				fs.rmSync(process.cwd() + '/package', { recursive: true, force: true });

				for(const fileA of fs.readdirSync('../src/output')) {
					console.log(fileA);
					fs.unlinkSync('../src/output/' + fileA);
				}

				res.download('wrapped.mp4', () => {
					fs.unlinkSync('wrapped.mp4');
					fs.unlinkSync('package.zip');
					alreadyRunning = false;
				});
			});
		});
});


// Start the server
app.listen(PORT, () => {
	console.log(`Server started at http://localhost:${PORT}`);
});