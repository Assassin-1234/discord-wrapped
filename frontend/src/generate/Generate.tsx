import '../index.css';
import clouds from '../assets/clouds.svg';
import { DragEvent, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { IconContext } from 'react-icons/lib';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { BiPlay, BiFullscreen } from 'react-icons/bi';
import { BsTwitter, BsStarFill } from 'react-icons/bs';
import { SiKofi } from 'react-icons/si';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Generate />);

/**
 * Generate page
 */
function Generate() {
	const [hover, setHover] = useState<boolean>(false);
	const [progress, setProgress] = useState<number>(0);
	const [info, setInfo] = useState<string>('');
	const [videoUrl, setVideoUrl] = useState<string>('');
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);

	const handlePlay = () => {
		if (isPlaying) {
			videoRef.current?.pause();
			setIsPlaying(false);
		} else {
			videoRef.current?.play();
			setIsPlaying(true);
		}
	};

	const handleEnded = () => {
		setIsPlaying(false);
	};

	const handleFile = async (file: File) => {
		if (file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
			toast.error('Invalid file type, please upload a .zip file.', {
				position: 'top-center',
				autoClose: 5000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				theme: 'dark',
			});
			return;
		}

		const formData = new FormData();
		formData.append('file', file);

		setProgress(Math.round((1 / 13) * 100));
		setInfo('Uploading your data package');

		await fetch(import.meta.env.MODE === 'production' ? '/api/generate/upload' : 'http://localhost:3020/api/generate/upload', {
			method: 'POST',
			body: formData,
		}).then(async res => {
			const data = await res.json();

			const ws = new WebSocket(import.meta.env.MODE === 'production' ? 'wss://discordwrapped.com/api/' : 'ws://localhost:3020/api/');

			ws.onopen = () => {
				ws.send(JSON.stringify({ id: data.id }));
			};

			ws.onmessage = async (event) => {
				const progressData = JSON.parse(event.data);
				setProgress(progressData.progress);
				setInfo(progressData.info);

				if (progressData.progress === 100) {
					ws.close();

					const videoResponse = await fetch(import.meta.env.MODE === 'production' ? `/api/generate/download/${data.id}` : `http://localhost:3020/api/generate/download/${data.id}`, {
						method: 'GET',
					});

					const videoBlob = await videoResponse.blob();

					setVideoUrl(URL.createObjectURL(videoBlob));
				}

				if (progressData.progress === 500) {
					ws.close();
					setProgress(0);
					setInfo('');

					toast.error(progressData.info, {
						position: 'top-center',
						autoClose: 5000,
						hideProgressBar: true,
						closeOnClick: true,
						pauseOnHover: true,
						draggable: true,
						theme: 'dark',
					});
				}
			};
		}).catch(() => {
			toast.error('Something went wrong, try uploading again.', {
				position: 'top-center',
				autoClose: 5000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				theme: 'dark',
			});
		});
	};

	const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
		setHover(true);
	};

	const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setHover(false);
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const file = event.dataTransfer.items[0].getAsFile();

		if (file) {
			handleFile(file);
			setHover(false);
		} else {
			toast.error('Something went wrong, try uploading instead.', {
				position: 'top-center',
				autoClose: 5000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				theme: 'dark',
			});
		}
	};

	const filePopup = () => {
		const input = document.createElement('input');
		input.setAttribute('type', 'file');
		input.setAttribute('accept', '.zip');
		input.addEventListener('change', (e: any) => handleFile(e.target.files[0]));
		input.addEventListener('error', () => {
			toast.error('Something went wrong while trying to open file popup.', {
				position: 'top-center',
				autoClose: 5000,
				hideProgressBar: true,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				theme: 'dark',
			});
		});
		input.click();
	};

	const downloadVideo = async () => {
		if (!videoUrl) {
			return;
		}

		const response = await fetch(videoUrl);
		const blob = await response.blob();

		const url = window.URL.createObjectURL(new Blob([blob]));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', 'DiscordWrapped.mp4');
		document.body.appendChild(link);
		link.click();
	};

	const shareOnTwitter = () => {
		const twitterUrl = 'https://twitter.com/intent/tweet?text=Check%20out%20my%20%23DiscordWrapped!%20Generate%20your%20own%3A%20https%3A%2F%2Fwww.discordwrapped.com%0A%0A%5BRemove%20this%20placeholder%2C%20then%20download%20your%20wrapped%20and%20drag%20it%20here%5D';
		window.open(twitterUrl, '_blank');
	};

	const star = () => {
		const githubUrl = 'https://github.com/Assassin-1234/discord-wrapped';
		window.open(githubUrl, '_blank');
	};

	return (
		<div className='h-screen w-screen'>
			{/* Overlay */}
			<div className='fixed top-0 left-0 w-screen h-screen bg-[#23272A] opacity-[68%] z-10'></div>

			{/* Modal */}
			<div className='flex h-screen w-screen fixed top-0 left-0 z-20'>
				<ToastContainer toastStyle={{ opacity: '95%', backgroundColor: '#23272A' }} />
				<div className='m-auto bg-gray rounded-3xl p-10 w-[95%] md:w-11/12 h-[95%] md:h-5/6 flex flex-col'>
					{videoUrl ? (
						<>
							<div className='flex flex-col items-center justify-center text-center'>
								<h1 className='text-white text-4xl md:text-6xl mt-0 md:mt-5 font-bold'>Your wrapped is ready</h1>
							</div>

							<div className='flex-grow flex items-center justify-center relative'>
								<div className='relative w-full md:w-[40%]'>
									<div style={{ position: 'relative' }}>
										<video className='flex rounded-xl z-0 cursor-pointer w-full h-auto' ref={videoRef} src={videoUrl} onClick={handlePlay} onEnded={handleEnded}></video>
										<div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-white justify-center items-center ${isPlaying ? 'opacity-0' : ''}`}>
											<button className='border-none bg-none' onClick={handlePlay}>
												<IconContext.Provider value={{ color: 'white', size: '2em' }}>
													<BiPlay />
												</IconContext.Provider>
											</button>
										</div>
										<div className={`absolute bottom-0 right-0 m-4 ${isPlaying ? 'opacity-0' : ''}`}>
											<IconContext.Provider value={{ className: 'text-white text-2xl md:text-4xl cursor-pointer bg-none border-none' }}>
												<button className='border-none bg-none' onClick={() => videoRef.current?.requestFullscreen()}>
													<BiFullscreen />
												</button>
											</IconContext.Provider>
										</div>
									</div>
								</div>

							</div>

							<div className='flex flex-col md:flex-row items-center justify-center space-x-0 md:space-x-4 mt-10'>
								<button className='bg-blurple text-white text-xl p-2 md:p-4' onClick={() => downloadVideo()}>
                                    Download your wrapped
								</button>

								<button className='bg-twitter text-white text-xl p-2 md:p-4 flex items-center' onClick={shareOnTwitter}>
									<BsTwitter className='mr-2' /> Share on Twitter
								</button>

								<button className='bg-gradient-to-b from-[#f0f3f6] to-[#e6ebf1] text-black text-xl p-2 md:p-4 flex items-center border-2 border-solid border-[#d1d2d3]' onClick={star}>
									<BsStarFill className='mr-2' /> Star
								</button>

								<button className='bg-kofi text-white text-xl p-2 md:p-4 flex items-center' onClick={() => window.open('https://ko-fi.com/assassin1234')}>
									<SiKofi className='mr-2' /> Support us
								</button>
							</div>
						</>
					) :
						progress > 0 && progress < 100 ? (
							<>
								<div className='flex flex-col items-center justify-center text-center'>
									<h1 className='text-white text-4xl md:text-6xl mt-0 md:mt-10 font-bold'>Generation in progress</h1>
									<p className='text-white text-xl md:text-3xl md-4 mt-2 md:mt-8 p-1 md:p-0'>We are generating your wrapped. The bigger your data package is, the longer it usually takes.</p>
								</div>

								<div className='flex flex-col h-full w-full items-center justify-start md:justify-center'>
									<p className='text-2xl md:text-3xl mb-2 mt-20 md:mt-0 text-center md:text-start'>{info}</p>
									<div className='border-white border-8 h-[10%] md:h-[15%] w-full md:w-[80%] overflow-hidden rounded-full'>
										<div className='bg-gradient-to-b from-blurple to-blurpleLight h-full transition-all' style={{ width: `${progress}%` }}></div>
									</div>
								</div>
							</>
						) : (
							<>
								<div className='flex flex-col items-center justify-center text-center'>
									<h1 className='text-white text-4xl md:text-6xl mt-0 md:mt-5 font-bold'>Upload your data package</h1>
									<p className='text-white text-xl md:text-3xl md-4 mt-2 md:mt-4 p-1 md:p-0'>We need your data package in order to generate your wrapped. Your data package will be removed immediately after your wrapped is done.</p>
								</div>

								<div
									className={`flex border-blurple border-4 border-dashed rounded-3xl mt-4 h-[40%] cursor-pointer ${hover ? ' bg-blurple' : ''}`}
									onClick={filePopup}
									onDrop={handleDrop}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
								>
									<label htmlFor='upload' className='flex flex-col items-center justify-center w-full cursor-pointer'>
										<p className={hover ? 'text-5xl' : 'hidden'}>Drop it, we'll take care of it!</p>
										<IoCloudUploadOutline className={`text-8xl md:text-9xl text-blurple${hover ? ' hidden' : ''}`} />
										<p className={`text-white text-lg text-center md:text-2xl mt-4${hover ? ' hidden' : ''}`}>
                                            Drop you data package here or <a className='text-blurple cursor-pointer' aria-label='Browse instead of dropping a file'>browse</a>.
										</p>
									</label>
								</div>
								<p className='text-lg md:text-2xl text-center md:text-start mt-[5%] md:mt-4'>Didn't receive your data package yet? Check out the demo on our <a href='/demo/' aria-label='Check out the demo'>demo page</a>.</p>
							</>
						)}
				</div>
			</div>

			{/* Clouds */}
			<img src={clouds} alt='clouds' className='block absolute bottom-0 left-0 w-full z-0' />
		</div>
	);
}
