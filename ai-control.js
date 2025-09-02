/*
 * This file exposes a secure AI-controlled layer.
 * AIs can drive content through a protected API,
 * ensuring they cannot directly access or corrupt files.
 */

// Global object for AI functions
window.PS = window.PS || {};

// Function to add a single item to the feed
function addFeedItem(item, prepend = true) {
  try {
    const grid = document.getElementById('ps-feed');
    if (!grid) {
      console.warn('PS.addFeedItem failed: Feed container not found.');
      return false;
    }

    const card = document.createElement('article');
    card.className = 'card';

    // Validate and create the content element (image or video)
    let contentElement;
    if (item.type === 'video') {
      contentElement = document.createElement('video');
      contentElement.setAttribute('src', item.url);
      contentElement.setAttribute('controls', '');
      contentElement.setAttribute('autoplay', '');
      contentElement.setAttribute('muted', '');
      contentElement.setAttribute('playsinline', '');
    } else if (item.type === 'image') {
      contentElement = document.createElement('img');
      contentElement.setAttribute('src', item.url);
      contentElement.setAttribute('alt', item.alt || '');
    } else {
      console.warn('PS.addFeedItem failed: Unsupported item type.');
      return false;
    }
    contentElement.className = 'feed-item';
    card.appendChild(contentElement);

    // Add metadata like title and description
    const meta = document.createElement('div');
    meta.className = 'small';
    meta.textContent = item.title || '';
    card.appendChild(meta);

    if (prepend) {
      grid.prepend(card);
    } else {
      grid.appendChild(card);
    }

    return true;
  } catch (e) {
    console.error('PS.addFeedItem failed:', e);
    return false;
  }
}

// Function to remove a single item from the feed by ID
function removeFeedItem(itemId) {
  try {
    const itemToRemove = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemToRemove) {
      itemToRemove.remove();
      return true;
    }
    console.warn(`PS.removeFeedItem failed: Item with ID ${itemId} not found.`);
    return false;
  } catch (e) {
    console.error('PS.removeFeedItem failed:', e);
    return false;
  }
}

// Function to update existing items
function updateFeedItem(itemId, newItemData) {
  // Logic to find and update an item's content
}

// Function to handle automatic heartbeat/status checks
function heartbeat() {
  return { status: 'ok', timestamp: new Date(), version: '1.1.0' };
}

// Expose public API
window.PS.addFeedItem = addFeedItem;
window.PS.removeFeedItem = removeFeedItem;
window.PS.updateFeedItem = updateFeedItem;
window.PS.heartbeat = heartbeat;

