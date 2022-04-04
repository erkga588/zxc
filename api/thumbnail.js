const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");

/** @typedef { import('@vercel/node').VercelResponse VercelResponse */
/** @typedef { import('@vercel/node').VercelRequest VercelRequest */

function parseTitle(title) {
  const match = /^Revision ([0-9]+)(?::(.+))?/.exec(title);
  if (!match) {
    console.warn(
      `WARNING: Unable to parse title "${title}", check if generated thumbnail is ok`
    );
    return { nr: -1, text: null };
  }
  return { nr: match[1], text: match[2] };
}

async function generateThumbnail(title, scaleFactor = 1) {
  console.log(`Rendering thumbnail...`);
  const { nr, text } = parseTitle(title);
  const tagText = nr > -1 ? `#${nr}` : `#spezial`;
  const subText = nr === -1 || !text ? title : text;
  const font = path.resolve("./public/SourceSansPro-Bold.ttf");
  registerFont(font, { family: "Source Sans Pro" });
  const image = await loadImage(path.resolve("./public/img/video.png"));
  const maxTextWidth = image.width - 2 * 250;
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  ctx.font = "bold 400px Source Sans Pro";
  ctx.textAlign = "left";
  ctx.fillStyle = "#910c69";
  ctx.strokeStyle = "#FFF";
  ctx.lineWidth = 80;
  ctx.strokeText(tagText, 250, canvas.height - 400);
  ctx.fillText(tagText, 250, canvas.height - 400);
  ctx.font = "bold 200px Source Sans Pro";
  ctx.lineWidth = 40;
  ctx.strokeText(subText, 250, canvas.height - 150, maxTextWidth);
  ctx.fillText(subText, 250, canvas.height - 150, maxTextWidth);

  const scale = createCanvas(
    image.width * scaleFactor,
    image.height * scaleFactor
  );
  const scaleContext = scale.getContext("2d");

  scaleContext.drawImage(
    canvas,
    0,
    0,
    image.width * scaleFactor,
    image.height * scaleFactor
  );

  return scale.toBuffer("image/jpeg");
}

/**
 *
 * @param {VercelRequest} req
 * @param {VercelResponse} res
 */
function handler(req, res) {
  const title = req.query.title || "Revision 000: Test und Test";
  const factor = req.query.scale || 1;
  generateThumbnail(title, parseFloat(factor)).then((result) => {
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "max-age=5184000, immutable");
    res.send(result);
  });
}

module.exports = handler;
