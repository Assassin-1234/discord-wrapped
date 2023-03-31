import '../index.css';
import clouds from '../assets/clouds.svg';
import { useState, useRef } from 'react';
import { IconContext } from 'react-icons/lib';
import { BiPlay, BiFullscreen } from 'react-icons/bi';

/**
 * Confirmation page
 */
function Demo() {
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

	const downloadVideo = async () => {
		const videoPath = 'src/assets/demo.mp4';

		const response = await fetch(videoPath);
		const blob = await response.blob();

		const url = window.URL.createObjectURL(new Blob([blob]));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', 'Demo.mp4');
		document.body.appendChild(link);
		link.click();
	};

	return (
		<div className='h-screen w-screen'>
			{/* Overlay */}
			<div className='fixed top-0 left-0 w-screen h-screen bg-[#23272A] opacity-[68%] z-10'></div>

			{/* Modal */}
			<div className='flex h-screen w-screen fixed top-0 left-0 z-20'>
				<div className='m-auto bg-gray rounded-3xl p-10 w-[95%] md:w-11/12 h-[95%] md:h-5/6'>
					<div className='flex flex-col items-center justify-center text-center'>
						<h1 className='text-white text-4xl md:text-6xl mt-0 md:mt-10 font-bold'>Demo</h1>
					</div>

					<div className='flex flex-col mt-5 relative items-center justify-center'>
						<div className='relative w-full md:w-[50%]'>
							<video className='flex rounded-xl z-0 cursor-pointer w-full h-auto' ref={videoRef} src='src/assets/demo.mp4' onClick={handlePlay} onEnded={handleEnded}></video>
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

						<div className='flex flitems-center justify-center'>
							<button className='bg-blurple text-white text-xl p-2 md:p-4 mt-4 md:mt-10' onClick={() => downloadVideo()}>
                                    Download demo
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Clouds */}
			<img src={clouds} alt='clouds' className='block absolute bottom-0 left-0 w-full z-0' />
		</div>
	);
}

export default Demo;
