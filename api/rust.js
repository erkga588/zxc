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
  const font = path.resolve("./public/FiraSans-Medium.ttf");
  registerFont(font, { family: "Fira" });
  const image = await loadImage(path.resolve("./public/img/rust-linz.png"));
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  ctx.font = "30px Fira";
  ctx.textAlign = "center";
  ctx.fillStyle = "#000";
  ctx.fillText(title, 725, canvas.height - 60, image.width);

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

const dates = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function normalize(hours) {
  if (hours > 12) {
    return [hours - 12, "pm"];
  } else {
    return [hours, "am"];
  }
}

/**
 *
 * @param {VercelRequest} req
 * @param {VercelResponse} res
 */
function handler(req, res) {
  const date = new Date(req.query.date || "2021-11-25T17:30:00");
  const [hours, ampm] = normalize(date.getHours());
  const title = `${dates[date.getDay()]}, ${
    months[date.getMonth()]
  } ${date.getDate()} - ${hours}:${date.getMinutes()}${ampm} CET`;
  const factor = req.query.scale || 1;
  generateThumbnail(title, parseFloat(factor)).then((result) => {
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "max-age=5184000, immutable");
    res.send(result);
  });
}

module.exports = handler;
