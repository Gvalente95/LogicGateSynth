const audioPath = "../../ressources/audio/";
class AudioManager {
	constructor() {
		this.lastPlayTime = 0;
		this.maxQueue = 200;
		this.active = true;
		this.playInterval = 0.05;
		this.audioQueue = [];
		this.buttonOk = new Audio(audioPath + "buttonOk.mp3");
		this.gameOn = new Audio(audioPath + "gameOn.mp3");
		this.dig = new Audio(audioPath + "dig.mp3");
		this.tuk = new Audio(audioPath + "tuk.mp3");
		this.click = new Audio(audioPath + "click.mp3");
		this.clock = new Audio(audioPath + "clock.mp3");
		this.soundCapture = new Audio(audioPath + "Capture.mp3");
		this.soundDenied = new Audio(audioPath + "denied.mp3");
		this.trill = new Audio(audioPath + "trill.mp3");
	}

	playSoundAtIndex(list, index, volume = 1)
	{
		const au = new Audio(list[index].src);
		au.volume = volume;
		this.lastPlayTime = performance.now();
		au.play();
	}

	playRandomSound(list, volume = 1) {
		if (!this.active) return;
		let index = r_range(0, list.length - 1);
		const au = new Audio(list[index].src);
		au.volume = volume;
		this.lastPlayTime = performance.now();
		au.play();
	}

	playSound(sound, volume = 1) {
		if (!this.active) return;
		this.lastPlayTime = performance.now();
		const newAu = new Audio(sound.src);
		newAu.volume = volume;
		newAu.play();
	}

	playLoop(sound, volume) {
		if (!this.active) return;
		sound.volume = volume;
		sound.onended = () => {
			this.playLoop(sound, volume);
		};
		sound.play();
	}

	playInQueue(original, volume) {
		if (!original)
			return;
		const au = new Audio(original.src);
		au.volume = volume;
		this.audioQueue.push(au);
		au.onended = () => {
			const idx = this.audioQueue.indexOf(au);
			if (idx !== -1) this.audioQueue.splice(idx, 1);
		};
		this.lastPlayTime = performance.now();
		au.play();
	}
}
