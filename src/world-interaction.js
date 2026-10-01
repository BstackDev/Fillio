(() => {
  'use strict';

  const contact = document.getElementById('world-contact');
  const message = document.getElementById('world-message');
  const button = document.getElementById('world-attune');
  if (!contact || !message || !button) return;

  const transmissions = [
    'Your signal reached the lower floors.',
    'A billion years of silence. One new footstep.',
    'The red seam has changed direction.',
    'Something on the far ridge turned toward you.',
    'Every strike remains inside the stone.'
  ];

  let transmissionIndex = 0;
  let resetTimer = 0;

  button.addEventListener('click', () => {
    transmissionIndex = (transmissionIndex + 1) % transmissions.length;
    message.textContent = transmissions[transmissionIndex];
    button.disabled = true;
    button.querySelector('span:first-child').textContent = 'Signal returned';
    contact.classList.add('is-answering');
    window.dispatchEvent(new CustomEvent('fillio:attune', {
      detail: { transmission: transmissionIndex }
    }));

    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      button.disabled = false;
      button.querySelector('span:first-child').textContent = 'Answer the signal';
      contact.classList.remove('is-answering');
    }, 1350);
  });

  window.addEventListener('fillio:worldbeat', (event) => {
    if (document.hidden || contact.classList.contains('is-answering')) return;
    const messageText = event.detail?.type === 'watcher'
      ? 'A shape crossed the ridge. The tower says nothing.'
      : 'The tower moved while no one was looking.';
    message.textContent = messageText;
    contact.classList.add('is-answering');
    window.setTimeout(() => contact.classList.remove('is-answering'), 1250);
  });
})();