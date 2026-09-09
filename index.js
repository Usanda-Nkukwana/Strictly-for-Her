function setupSlideshow(slideshow, itemLabel, autoAdvance = false) {
	const slides = Array.from(slideshow.querySelectorAll('.slide'));
	const previousButton = slideshow.querySelector('.previous');
	const nextButton = slideshow.querySelector('.next');
	const dotsContainer = slideshow.querySelector('.slide-dots');
	let currentSlide = 0;

	if (!slides.length || !previousButton || !nextButton || !dotsContainer) return;

	function showSlide(slideIndex) {
		currentSlide = (slideIndex + slides.length) % slides.length;
		slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
		dotsContainer.querySelectorAll('.slide-dot').forEach((dot, index) => {
			dot.classList.toggle('active', index === currentSlide);
			dot.setAttribute('aria-current', index === currentSlide ? 'true' : 'false');
		});
	}

	slides.forEach((slide, index) => {
		const dot = document.createElement('button');
		dot.className = 'slide-dot';
		dot.type = 'button';
		dot.setAttribute('aria-label', `Show ${itemLabel} ${index + 1}`);
		dot.addEventListener('click', () => showSlide(index));
		dotsContainer.appendChild(dot);
	});
	previousButton.addEventListener('click', () => showSlide(currentSlide - 1));
	nextButton.addEventListener('click', () => showSlide(currentSlide + 1));
	showSlide(0);
	if (autoAdvance && slides.length > 1) {
		window.setInterval(() => showSlide(currentSlide + 1), 3000);
	}
}

function setupTypewriter(element) {
	const originalNodes = Array.from(element.childNodes);
	const textNodes = [];
	let characterCount = 0;

	function buildNode(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			const textNode = document.createTextNode('');
			textNodes.push({ source: node.textContent, target: textNode });
			characterCount += Array.from(node.textContent).length;
			return textNode;
		}

		const clone = node.cloneNode(false);
		Array.from(node.childNodes).forEach((child) => clone.appendChild(buildNode(child)));
		return clone;
	}

	element.setAttribute('aria-label', element.textContent.trim());
	element.replaceChildren(...originalNodes.map(buildNode));

	let currentCharacter = 0;
	const typeNextCharacter = () => {
		currentCharacter += 1;
		let remainingCharacters = currentCharacter;

		textNodes.forEach(({ source, target }) => {
			const visibleText = Array.from(source).slice(0, remainingCharacters).join('');
			target.textContent = visibleText;
			remainingCharacters -= visibleText.length;
		});

		if (currentCharacter < characterCount) window.setTimeout(typeNextCharacter, 28);
	};

	if (characterCount > 0) window.setTimeout(typeNextCharacter, 350);
}

document.querySelectorAll('.intro').forEach(setupTypewriter);
document.querySelectorAll('.slideshow:not(.memory-slideshow)').forEach((slideshow) => setupSlideshow(slideshow, 'picture', true));

async function loadMemories() {

	const memorySlides = document.querySelector('#memory-slides');
	if (!memorySlides || typeof SUPABASE_URL === 'undefined' || SUPABASE_URL.includes('YOUR-PROJECT')) return;

	try {
		const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*&order=memory_date.desc` , {
			headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
		});
		if (!response.ok) throw new Error('Memories could not be loaded.');
		const memories = await response.json();

		if (!memories.length) {
			memorySlides.innerHTML = '<p class="memory-status">Your first memory is waiting to be added.</p>';
			return;
		}

		memories.forEach((memory) => {
			const slide = document.createElement('div');
			slide.className = 'slide memory-slide';
			const image = document.createElement('img');
			image.src = memory.image_url;
			image.alt = memory.description;
			const content = document.createElement('div');
			content.className = 'memory-slide-content';
			const meta = document.createElement('p');
			meta.className = 'memory-meta';
			meta.textContent = `${new Intl.DateTimeFormat('en-ZA', { dateStyle: 'long' }).format(new Date(`${memory.memory_date}T00:00:00`))} · ${memory.location}`;
			const description = document.createElement('p');
			description.textContent = memory.description;
			content.append(meta, description);
			slide.append(image, content);
			memorySlides.appendChild(slide);
		});
		setupSlideshow(document.querySelector('.memory-slideshow'), 'memory');
	} catch (error) {
		memorySlides.innerHTML = `<p class="memory-status">${error.message}</p>`;
	}
}

loadMemories();
