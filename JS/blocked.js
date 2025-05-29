const optionsURL = chrome.runtime.getURL("/HTML/options.html");
const container = document.querySelector(".blocked-container");
const mainText = document.getElementById("main-text");
const video = document.getElementById("video-container");
const optionsLinkDOM = document.getElementById("options-link");

const textOptions = [
  "I don't stop when I'm tired. I stop when I'm done.",
  "Life is one big tug of war between mediocrity and trying to find your best self.",
  "If you can get through doing things that you hate to do, on the other side is greatness.",
  "You gotta start your journey. It may suck, but eventually you will come out the other side on top.",
  "You want to be uncommon amongst uncommon people.",
  "We don't rise to the level of our expectations, we fall to the level of our training.",
  "Nobody cares what you did yesterday. What have you done today to better yourself?",
  "The only thing more contagious than a good attitude is a bad one.",
  "Greatness pulls mediocrity into the mud. Get out there and get after it.",
  "Embrace suffering, you have to suffer.",
];

const videoOptions = [
  "https://www.youtube.com/embed/TLKxdTmk-zc",
  "https://www.youtube.com/embed/-JMAgzKvlIY",
  "https://www.youtube.com/embed/azROJC2YJ4g",
  "https://www.youtube.com/embed/dIM7E8e9JKY",
  "https://www.youtube.com/embed/d7i-VGXaQ54",
  "https://www.youtube.com/embed/OJXEZNei0_c",
  "https://www.youtube.com/embed/cH0gED2stDM",
  "https://www.youtube.com/embed/Z9WjyTGPAME",
  "https://www.youtube.com/embed/2d9mIQhidtc",
  "https://www.youtube.com/embed/V3z186LohfY",
  "https://www.youtube.com/embed/6aw9h5QMNbE",
  "https://www.youtube.com/embed/__p8KRodtLE",
];

const backgroundOptions = ["/IMAGES/1.webp", "/IMAGES/2.jpeg", "/IMAGES/3.jpg"];

function getRandomItem(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

function isValidYouTubeEmbed(url) {
  return url && url.startsWith("https://www.youtube.com/embed/");
}

function setupBlockedPage() {
  try {
    const backgroundImage = getRandomItem(backgroundOptions);
    if (backgroundImage && container) {
      container.style.backgroundImage = `url(${backgroundImage})`;
    }

    const randomText = getRandomItem(textOptions);
    if (randomText && mainText) {
      mainText.innerText = randomText;
    }

    const randomVideoUrl = getRandomItem(videoOptions);
    if (randomVideoUrl && isValidYouTubeEmbed(randomVideoUrl) && video) {
      video.src = randomVideoUrl;

      video.onerror = () => {
        console.warn("Failed to load video:", randomVideoUrl);
        video.style.display = "none";
      };
    }

    if (optionsLinkDOM) {
      optionsLinkDOM.href = optionsURL;
      optionsLinkDOM.textContent = "Goggins Blocker.";
    }
  } catch (error) {
    console.error("Error setting up blocked page:", error);
    if (mainText) {
      mainText.innerText = "Stay focused. Get back to work.";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupBlockedPage();
});
