const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");
const playlistElement = document.getElementById("playlist");
const playBtn = document.getElementById("playBtn");
const progress = document.getElementById("progress");
const currentTimeLabel = document.getElementById("currentTime");
const durationLabel = document.getElementById("duration");
const songTitle = document.getElementById("songTitle");
const artistName = document.getElementById("artistName");
const cover = document.getElementById("cover");
const trackCount = document.getElementById("trackCount");
const autoplay = document.getElementById("autoplay");
let tracks = [];
let currentIndex = -1;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
function renderPlaylist() {
  playlistElement.innerHTML = "";
  trackCount.textContent = `${tracks.length} ${tracks.length === 1 ? "song" : "songs"}`;
  if (!tracks.length) {
    playlistElement.innerHTML = '<li class="empty">Your playlist is empty. Add audio files to begin.</li>';
    return;
  }
  tracks.forEach((track, index) => {
    const item = document.createElement("li");
    item.className = `track${index === currentIndex ? " active" : ""}`;
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    const number = document.createElement("span");
    number.className = "track-number";
    number.textContent = index === currentIndex ? "♪" : String(index + 1).padStart(2, "0");
    const info = document.createElement("span");
    info.className = "track-info";
    const title = document.createElement("strong");
    title.textContent = track.name;
    const artist = document.createElement("small");
    artist.textContent = "Local audio";
    info.append(title, artist);
    const length = document.createElement("span");
    length.className = "track-duration";
    length.textContent = formatTime(track.duration);
    item.append(number, info, length);
    item.addEventListener("click", () => loadTrack(index, true));
    item.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); loadTrack(index, true); }
    });
    playlistElement.appendChild(item);
  });
}
function loadTrack(index, shouldPlay = false) {
  if (!tracks.length) return;
  currentIndex = (index + tracks.length) % tracks.length;
  const track = tracks[currentIndex];
  audio.src = track.url;
  songTitle.textContent = track.name;
  artistName.textContent = "Local audio file";
  progress.value = 0;
  currentTimeLabel.textContent = "0:00";
  durationLabel.textContent = formatTime(track.duration);
  renderPlaylist();
  if (shouldPlay) {
    audio.play().then(updatePlayButton).catch(() => {
      artistName.textContent = "Unable to play this file. Try another audio file.";
      updatePlayButton();
    });
  } else updatePlayButton();
}
function updatePlayButton() {
  const isPlaying = !audio.paused;
  playBtn.textContent = isPlaying ? "Ⅱ" : "▶";
  playBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  cover.classList.toggle("playing", isPlaying);
}
function playNext() {
  if (!tracks.length) return;
  loadTrack(currentIndex + 1, true);
}
fileInput.addEventListener("change", event => {
  const files = [...event.target.files].filter(file => file.type.startsWith("audio/"));
  if (!files.length) {
    artistName.textContent = "Please choose valid audio files.";
    return;
  }
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    tracks.push({ name: file.name.replace(/\.[^/.]+$/, ""), url, duration: 0 });
    const trackIndex = tracks.length - 1;
    const probe = new Audio();
    probe.preload = "metadata";
    probe.src = url;
    probe.addEventListener("loadedmetadata", () => {
      tracks[trackIndex].duration = probe.duration;
      if (trackIndex === currentIndex) durationLabel.textContent = formatTime(probe.duration);
      renderPlaylist();
    }, { once: true });
  });
  renderPlaylist();
  if (currentIndex === -1) loadTrack(0, false);
  artistName.textContent = `${tracks.length} songs in your playlist`;
  fileInput.value = "";
});
playBtn.addEventListener("click", () => {
  if (currentIndex === -1) {
    artistName.textContent = "First add audio files using the button below.";
    return;
  }
  if (audio.paused) audio.play().then(updatePlayButton).catch(() => {
    artistName.textContent = "Playback failed. Please select another audio file.";
  });
  else audio.pause();
  updatePlayButton();
});
document.getElementById("prevBtn").addEventListener("click", () => {
  if (!tracks.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  loadTrack(currentIndex - 1, true);
});
document.getElementById("nextBtn").addEventListener("click", playNext);
audio.addEventListener("timeupdate", () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  progress.value = (audio.currentTime / audio.duration) * 100;
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  durationLabel.textContent = formatTime(audio.duration);
});
progress.addEventListener("input", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0)
    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
});
document.getElementById("volume").addEventListener("input", event => {
  audio.volume = Number(event.target.value);
});
audio.volume = 0.8;
audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);
audio.addEventListener("ended", () => {
  if (autoplay.checked) playNext();
  else updatePlayButton();
});
renderPlaylist();