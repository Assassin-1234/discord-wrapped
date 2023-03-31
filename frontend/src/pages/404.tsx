import { VscError } from 'react-icons/vsc';
import clouds from '../assets/clouds.svg';

/**
 * 404 page
 */
function NotFoundPage() {
	return (
		<div className='h-screen w-screen'>
			{/* Overlay */}
			<div className='fixed top-0 left-0 w-screen h-screen bg-[#23272A] opacity-[68%] z-10'></div>

			{/* Modal */}
			<div className='flex h-screen w-screen fixed top-0 left-0 z-20'>
				<div className='m-auto bg-gray rounded-3xl p-10 w-[95%] md:w-11/12 h-[95%] md:h-5/6 flex flex-col justify-center items-center'>
					<VscError className='text-red text-[15rem]' />
					<h1 className='text-5xl font-bold mt-10'>404</h1>
					<h2 className='text-2xl mt-5'>Can't find the page you are looking for</h2>
					<a href='/' className='text-2xl mt-5 underline' aria-label='Return back to home'>Return to home</a>
				</div>
			</div>

			{/* Clouds */}
			<img src={clouds} alt='clouds' className='block absolute bottom-0 left-0 w-full z-0' />
		</div>
	);
}

export default NotFoundPage;