import './index.css';
import icon from './assets/icon.webp';
import clouds from './assets/clouds.svg';
import { RiArrowDropDownLine } from 'react-icons/ri';
import { BsGithub } from 'react-icons/bs';
import { SiKofi } from 'react-icons/si';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Home />);

/**
 * Home page
 */
function Home() {
	const generate = () => {
		window.location.href = '/generate/';
	};

	const now = new Date();
	const utcTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));

	return (
		<>
			{/* Desktop Navbar */}
			<nav className='hidden md:flex max-w-screen'>
				<div className='flex justify-between items-center h-28 flex-row'>
					<a href='/' className='pl-8 flex items-center justify-center' aria-label='Back to home'>
						<img src={icon} alt='logo' className='h-20' />
						<span className='text-white hover:text-white hover:opacity-85 transition text-3xl font-bold ml-3'>Discord Wrapped</span>
					</a>
				</div>
			</nav>

			{/* Mobile Navbar */}
			<nav className='md:hidden max-w-screen'>
				<div className='flex justify-center items-center h-24 bg-gray flex-row rounded-b-2xl w-full'>
					<a href='/' className='flex items-center' aria-label='Back to home'>
						<img src={icon} alt='logo' className='h-16' />
						<span className='text-white hover:text-white hover:opacity-85 transition text-2xl font-bold ml-3'>Discord Wrapped</span>
					</a>
				</div>
			</nav>

			{/* Main Content */}
			<div className='h-screen'>
				<div className='flex flex-col items-center justify-center text-center mt-48'>
					<h1 className='text-white text-4xl md:text-8xl font-bold'>Discord Wrapped</h1>
					<p className='text-white text-xl md:text-3xl mt-2 p-1 md:p-0'>An insight on all the data collected by Discord, formed into a video just like Spotify Wrapped!</p>
					<button className='text-xl mt-7 z-10' onClick={generate}>Generate Your Wrapped</button>
					<RiArrowDropDownLine size={70} className='mt-10 motion-safe:animate-bounce' />
				</div>

				{/* Extra info */}
				<div className='bg-gray rounded-t-2xl py-8 text-white absolute top-full max-w-screen w-full'>
					<div className='px-5 md:pl-20 pb-10 text-center mt-16 md:mt-20 md:text-start'>
						<h1 className='text-2xl md:text-4xl font-bold'>Discord Data Package</h1>
						<p className='text-xl md:text-2xl mt-2'>We need your data package to be able to generate your wrapped. Find out
                            how to request your data package <a href='https://support.discord.com/hc/en-us/articles/360004027692-Requesting-a-Copy-of-your-Data' aria-label='How to request your data'>in this article</a>.</p>
						<p className='text-xl md:text-2xl mt-4'>Didn't receive your data package yet? Check out the demo on our <a href='/demo/' aria-label='Check out our demo'>demo page</a>.</p>
					</div>

					<div className='px-5 md:pl-20 pb-10 text-center md:text-start'>
						<h1 className='text-2xl md:text-4xl font-bold'>Funding</h1>
						<p className='text-xl md:text-2xl mt-2'>Thanks to <a href='https:/celendi.gg/' aria-label='Celendi'>Celendi</a>, we're able to provide the best experience possible. Their funding has allowed us to bring out a website that allows to generate multiple videos at the same time without the need of a queue system.</p>
					</div>

					<div className='px-5 md:pl-20 pb-10 text-center md:text-start'>
						<h1 className='text-2xl md:text-4xl font-bold'>Privacy</h1>
						<p className='text-xl md:text-2xl mt-2'>We only use your data to generate your wrapped. We do not share your data with anyone. We do not sell your data. We do not use your data for anything else than generating your wrapped. Your data automatically gets deleted after your wrapped is generated.</p>
					</div>

					<div className='px-5 md:pl-20 pb-10 text-center md:text-start'>
						<h1 className='text-2xl md:text-4xl font-bold'>Donate</h1>
						<p className='text-xl md:text-2xl mt-2'>You can donate and thank us for our work on Ko-Fi with the button below.</p>
						<button className='bg-kofi text-xl mt-7 p-3 flex items-center mx-auto md:mx-0' onClick={() => window.open('https://ko-fi.com/assassin1234')}>
							<SiKofi className='mr-2' /> Support us
						</button>
					</div>


					<div className='px-5 md:pl-20 pb-10 text-center md:text-start'>
						<h1 className='text-2xl md:text-4xl font-bold'>Open-source</h1>
						<p className='text-xl md:text-2xl mt-2'>Discord Wrapped is open-source. You can find the source code <a href='https://github.com/Assassin-1234/discord-wrapped/' aria-label='Our GitHub repository'>in our GitHub repository</a>. Feel free to contribute!</p>
						<p className='text-xl md:text-2xl mt-4'>If you like this project please consider staring the repository on GitHub, so we can reach more people.</p>
					</div>

					<div className='px-5 md:pl-20 pb-10 text-center md:text-start'>
						<h1 className='text-2xl md:text-4xl font-bold'>Restarts</h1>
						<p className='text-xl md:text-2xl mt-2'>All wrappeds are stored in the memory of the server. This means that you got the time to download your wrapped before the server restarts. If you don't download your wrapped in time, you will have to generate it again.</p>
						<p className='text-xl md:text-2xl mt-4'>Our server restarts everyday at <span className='border-dashed border-b-2' title='In your time zone'>{utcTime.toLocaleTimeString()}</span></p>
					</div>

					{/* Footer */}
					<div className='flex flex-row items-center justify-center text-center absolute bottom-0 w-full mb-4'>
						<a href='https://github.com/Assassin-1234/discord-wrapped/' className='hidden md:flex text-center text-white transition text-xl font-bold pr-2' aria-label='Our GitHub repository'><BsGithub size={30} /></a>
						<p className='text-lg md:text-xl px-4'>Discord Wrapped is not affiliated with Discord Inc. <span className='text-base p-0.5'>●</span> Made with ❤ by <a href='https://github.com/Iliannnn' aria-label='Iliannnn, the creator of this website'>Iliannnn</a></p>
					</div>
				</div>
			</div>

			{/* Clouds */}
			<img src={clouds} alt='clouds' className='block absolute bottom-0 left-0 w-full' />
		</>
	);
}