"""Check frozen files, links and aggregate cost arithmetic without private logs."""
import hashlib
import html.parser
import json
import pathlib
import urllib.parse

root = pathlib.Path(__file__).resolve().parents[1]
docs = root / 'docs'
experiment = docs / 'experiments/2026-09-30-coastal-cat'
data = json.loads((experiment / 'analysis-data.json').read_text('utf-8'))
pricing = json.loads((experiment / 'data/pricing.json').read_text('utf-8'))
manifest = json.loads((experiment / 'data/artifact-manifest.json').read_text('utf-8'))
movie_info = json.loads((experiment / 'evidence/douyin-video-manifest.json').read_text('utf-8'))

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

assert len(data['subjects']) == 7
assert len({s['id'] for s in data['subjects']}) == 7
assert data['quality_ranking']['order'] == [5, 6, 1, 2, 7, 4, 3]
assert sorted(s['quality_rank'] for s in data['subjects']) == list(range(1, 8))
total = 0
for s in data['subjects']:
    t = s['tokens']
    p = pricing['standard'][s['model']]
    uncached = t['input_tokens'] - t['cached_input_tokens']
    assert uncached == s['uncached_input'] and uncached >= 0
    cost = (uncached * p['uncached_input'] + t['cached_input_tokens'] * p['cached_input'] + t['output_tokens'] * p['output']) / 1_000_000
    credits = sum(a * b for a, b in zip([uncached, t['cached_input_tokens'], t['output_tokens']], p['credits'])) / 1_000_000
    assert abs(cost - s['api_standard_usd']) < 1e-9
    assert abs(credits - s['credit_standard']) < 1e-7
    assert 0 <= t['reasoning_output_tokens'] <= t['output_tokens']
    assert s['max_request_input'] <= 272_000
    total += cost
    for scenario in s['fast_scenarios']:
        T, M = s['duration_ms'] / 1000, s['estimated_model_response_seconds']
        expected = T - M + M / scenario['model_response_speedup']
        assert abs(expected - scenario['task_seconds']) < 1e-6
for artifact in manifest:
    assert sha(experiment / artifact['file']) == artifact['sha256']
    assert sha(experiment / artifact['source_file']) == artifact['source_sha256']
movie = docs / 'media/coastal-cat-review-1080p.mp4'
assert sha(movie) == movie_info['sha256']
assert movie.stat().st_size == movie_info['file_bytes']
assert sum(x['duration'] for x in movie_info['timeline']) == movie_info['duration'] == 95
assert movie_info['width'] == 1080 and movie_info['height'] == 1920 and movie_info['audio_tracks'] == 0
assert list(docs.rglob('*.mp4')) == [movie], 'Only one published movie is expected'

class Links(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.add(a['id'])
        for key in ['href', 'src', 'poster']:
            if a.get(key):
                self.links.append(a[key])

parsed = {}
for path in docs.rglob('*.html'):
    parser = Links()
    parser.feed(path.read_text('utf-8'))
    parsed[path.resolve()] = parser
checked = 0
for path, parser in parsed.items():
    for link in parser.links:
        uri = urllib.parse.urlsplit(link)
        if uri.scheme or uri.netloc:
            continue
        target = (path.parent / urllib.parse.unquote(uri.path)).resolve() if uri.path else path
        if target.is_dir():
            target /= 'index.html'
        assert target.exists(), f'Missing link: {path.relative_to(root)} -> {link}'
        if uri.fragment and target.suffix == '.html':
            assert urllib.parse.unquote(uri.fragment) in parsed[target].ids, f'Missing anchor: {link}'
        checked += 1
print(json.dumps({'status': 'PASS', 'subjects': 7, 'artifact_and_source_hashes': 14,
                  'html_links_checked': checked, 'standard_equivalent_usd': round(total, 7),
                  'one_movie_sha256': movie_info['sha256']}, ensure_ascii=False))
