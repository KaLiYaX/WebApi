// FILE: scrapers/youtube.js
// YouTube Scraper Functions - CLEAN RESPONSE (NO CREATOR/OWNER INFO)

const axios = require('axios');
const yts = require('yt-search');
const { createDecipheriv } = require('crypto');

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const extractVideoId = (url) => {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;
  const result = url.match(regex);
  return result ? result[1] : null;
};

const audioQualities = [32, 64, 96, 128, 160, 192, 256, 320];
const videoQualities = [144, 240, 360, 480, 720, 1080, 1440];

const decryptInfo = (encoded) => {
  const secret = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
  const buffer = Buffer.from(encoded, 'base64');
  const iv = buffer.slice(0, 16);
  const encrypted = buffer.slice(16);
  const key = Buffer.from(secret, 'hex');

  const decipher = createDecipheriv('aes-128-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString());
};

const fetchDownload = async (url, quality, type) => {
  try {
    const { data: cdnData } = await axios.get('https://media.savetube.me/api/random-cdn');
    const cdnUrl = `https://${cdnData.cdn}`;

    const { data: infoEnc } = await axios.post(`${cdnUrl}/v2/info`, { url }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Android)',
        'Referer': 'https://yt.savetube.me/1kejjj1?id=362796039'
      }
    });

    const info = decryptInfo(infoEnc.data);

    const { data: downloadRes } = await axios.post(`${cdnUrl}/download`, {
      downloadType: type,
      quality: String(quality),
      key: info.key
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Android)',
        'Referer': 'https://yt.savetube.me/start-download?from=1kejjj1%3Fid%3D362796039'
      }
    });

    let size = null;
    try {
      const { headers } = await axios.head(downloadRes.data.downloadUrl);
      size = headers['content-length'] ? Number(headers['content-length']) : null;
    } catch (e) {
      console.warn('Failed to get file size:', e.message);
    }

    return {
      url: downloadRes.data.downloadUrl,
      quality: `${quality}${type === 'audio' ? 'kbps' : 'p'}`,
      availableQuality: type === 'audio' ? audioQualities : videoQualities,
      size,
      filename: `${info.title} (${quality}${type === 'audio' ? 'kbps).mp3' : 'p).mp4'}`
    };

  } catch (err) {
    console.error('Download error:', err.message);
    return { error: 'Download failed' };
  }
};

// ==========================================
// EXPORTED FUNCTIONS - CLEAN RESPONSE
// ==========================================

async function ytmp3(link, quality = 128) {
  const id = extractVideoId(link);
  if (!id) return { error: 'Invalid YouTube URL' };

  const finalQuality = audioQualities.includes(+quality) ? +quality : 128;
  const videoUrl = `https://youtube.com/watch?v=${id}`;

  try {
    const info = await yts(videoUrl);
    const result = await fetchDownload(videoUrl, finalQuality, 'audio');
    
    // ✅ CLEAN RESPONSE - No creator/owner info
    return {
      metadata: info.all[0],
      download: result
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function ytmp4(link, quality = 360) {
  const id = extractVideoId(link);
  if (!id) return { error: 'Invalid YouTube URL' };

  const finalQuality = videoQualities.includes(+quality) ? +quality : 360;
  const videoUrl = `https://youtube.com/watch?v=${id}`;

  try {
    const info = await yts(videoUrl);
    const result = await fetchDownload(videoUrl, finalQuality, 'video');
    
    // ✅ CLEAN RESPONSE - No creator/owner info
    return {
      metadata: info.all[0],
      download: result
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function transcript(url) {
  try {
    let res = await axios.get('https://yts.kooska.xyz/', {
      params: { url: url },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        'Referer': 'https://kooska.xyz/'
      }
    }).then(i => i.data);
    
    // ✅ CLEAN RESPONSE - No creator/owner info
    return {
      video_id: res.video_id,
      summarize: res.ai_response,
      transcript: res.transcript
    };
  } catch (e) {
    return {
      error: `Failed to get response: ${e.message}`
    };
  }
}

async function playmp3(query, quality = 128) {
  try {
    const searchResult = await search(query);
    if (!searchResult.results || !searchResult.results.length)
      return { error: 'Video not found' };

    const results = [];
    for (let video of searchResult.results.slice(0, 5)) {
      const downloadInfo = await fetchDownload(video.url, quality, 'audio');
      results.push({
        title: video.title,
        author: video.author.name,
        duration: video.timestamp,
        url: video.url,
        thumbnail: video.thumbnail,
        download: downloadInfo
      });
    }

    // ✅ CLEAN RESPONSE - No creator/owner info
    return {
      type: 'audio',
      results
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function playmp4(query, quality = 360) {
  try {
    const searchResult = await search(query);
    if (!searchResult.results || !searchResult.results.length)
      return { error: 'Video not found' };

    const results = [];
    for (let video of searchResult.results.slice(0, 5)) {
      const downloadInfo = await fetchDownload(video.url, quality, 'video');
      results.push({
        title: video.title,
        author: video.author.name,
        duration: video.timestamp,
        url: video.url,
        thumbnail: video.thumbnail,
        download: downloadInfo
      });
    }

    // ✅ CLEAN RESPONSE - No creator/owner info
    return {
      type: 'video',
      results
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function search(query) {
  try {
    let data = await yts(query);
    
    // ✅ CLEAN RESPONSE - No creator/owner info
    return {
      results: data.all
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

module.exports = {
  search,
  playmp3,
  playmp4,
  ytmp3,
  ytmp4,
  transcript
};
