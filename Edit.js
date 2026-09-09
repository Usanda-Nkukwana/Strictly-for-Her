const memoryForm = document.querySelector('#memory-form');
const statusMessage = document.querySelector('#form-status');
const imageInput = document.querySelector('#memory-image');
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function setStatus(message, isError = false) {
	statusMessage.textContent = message;
	statusMessage.style.color = isError ? '#a33f39' : '#bd6861';
}

memoryForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	const file = imageInput.files[0];
	const submitButton = memoryForm.querySelector('button[type="submit"]');

	if (!file || file.size > MAX_FILE_SIZE) {
		setStatus('Please choose an image smaller than 5 MB.', true);
		return;
	}

	submitButton.disabled = true;
	setStatus('Saving your memory...');

	const filePath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
	const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filePath}`;

	try {
		const uploadResponse = await fetch(uploadUrl, {
			method: 'POST',
			headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': file.type },
			body: file
		});
		if (!uploadResponse.ok) throw new Error('The image could not be uploaded.');

		const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;
		const memory = {
			image_url: imageUrl,
			description: memoryForm.description.value.trim(),
			memory_date: memoryForm.memory_date.value,
			location: memoryForm.location.value.trim()
		};
		const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
			method: 'POST',
			headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
			body: JSON.stringify(memory)
		});
		if (!insertResponse.ok) throw new Error('The image uploaded, but its details could not be saved.');

		memoryForm.reset();
		setStatus('Saved. This memory will now appear in Memory Lane.');
	} catch (error) {
		setStatus(error.message, true);
	} finally {
		submitButton.disabled = false;
	}
});
