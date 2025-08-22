const express = require('express');
const router = express.Router();

// ============== ใช้ parser เดิมของคุณได้เลย ==============
function parseLatLngFromGoogleUrl(url) {
  if (!url) return null;
  const s = decodeURIComponent(String(url).trim()).replace(/\u2212/g, "-");

  let m = s.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/[?&](?:q|ll)=(?:loc:)?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/[?&]query=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/\/dir\/[^/]*\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:[/?]|$)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  m = s.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[2], lng: +m[1] };

  m = s.match(/[?&](?:daddr|destination|origin)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2] };

  return null;
}

router.get('/expand-gmaps', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'url required' });

    let finalUrl = url;
    // ถ้าเป็น short link ค่อยตาม redirect
    if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i.test(url)) {
      const resp = await fetch(url, { redirect: 'follow' });
      finalUrl = resp.url;
    }

    const coords = parseLatLngFromGoogleUrl(finalUrl);
    if (!coords) {
      return res.status(422).json({ message: 'Could not extract coordinates from URL', finalUrl });
    }
    res.json({ finalUrl, ...coords });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
