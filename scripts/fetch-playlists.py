"""Fetch YouTube Music playlists into data/*.json using yt-dlp."""
import json
import re
import subprocess
from pathlib import Path

PLAYLISTS = {
    "nepali": "PLETcP_FdLOGY",
    "punjabi": "PLKGdFvuCgQRQ",
    "bhojpuri": "PLVTwrTzYCvPU",
}

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def clean_artist(channel: str) -> str:
    channel = re.sub(r"\s*-\s*Topic$", "", channel)
    channel = re.sub(r"\s*Topic$", "", channel)
    if "|" in channel:
        channel = channel.split("|")[0]
    return channel.strip()


def clean_title(title: str) -> str:
    title = re.sub(r"\s*\(.*Lyrics.*\)", "", title, flags=re.I)
    title = re.sub(r"\s*\(Official Music Video\).*", "", title, flags=re.I)
    title = re.sub(r"\s*\|.*$", "", title)
    title = re.sub(r"\s+with lyrics.*", "", title, flags=re.I)
    title = re.sub(r"\s*-\s*$", "", title)
    return title.strip()


def fetch_playlist(name: str, playlist_id: str) -> None:
    url = f"https://www.youtube.com/playlist?list={playlist_id}"
    result = subprocess.run(
        ["yt-dlp", "-J", "--flat-playlist", url],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    data = json.loads(result.stdout)
    tracks = []
    seen = set()
    for entry in data.get("entries", []):
        vid = entry.get("id")
        if not vid or vid in seen:
            continue
        seen.add(vid)
        title = clean_title(entry.get("title", "Unknown"))
        artist = clean_artist(entry.get("channel", entry.get("uploader", "Unknown")))
        dur = entry.get("duration") or 0
        tracks.append(
            {
                "id": vid,
                "title": title,
                "titleHi": title,
                "artist": artist,
                "duration": int(dur),
                "thumbnail": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
            }
        )
    out = DATA_DIR / f"{name}.json"
    out.write_text(
        json.dumps({"playlistId": playlist_id, "tracks": tracks}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"{name}: {len(tracks)} tracks → {out}")


if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)
    for n, pid in PLAYLISTS.items():
        fetch_playlist(n, pid)
