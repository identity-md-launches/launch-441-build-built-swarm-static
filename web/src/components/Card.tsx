import type { CommunityLink, GalleryItem, Kind } from '../types';
import { KINDS } from '../types';
import { resolveUrl } from '../lib/markdown';
import { Glyph, GlyphIcon } from './Glyph';

const asKind = (k: unknown): Kind => (KINDS.includes(k as Kind) ? (k as Kind) : 'contracts');

function Tile({ kind, name, children }: { kind: Kind; name: string; children?: React.ReactNode }) {
  return (
    <div className={`tile tile-${kind}`}>
      <div className="tile-mark" aria-hidden="true"><GlyphIcon kind={kind} size={22} /></div>
      <div className="tile-name">{name}</div>
      {children}
    </div>
  );
}

function MediaBlock({ item, kind, base }: { item: GalleryItem; kind: Kind; base: string }) {
  const name = item.name ?? 'untitled';
  const m = item.media ?? {};
  const src = m.src ? resolveUrl(m.src, base) : null;
  const poster = m.poster ? resolveUrl(m.poster, base) : null;
  const extra = (item.extra ?? {}) as Record<string, unknown>;

  if ((m.type === 'screenshot' || m.type === 'image') && src) {
    return <img className="media-img" src={src} alt={m.type === 'screenshot' ? `screenshot of ${name}` : name} loading="lazy" decoding="async" width={1280} height={800} />;
  }
  if (m.type === 'video' && src) {
    return (
      <video className="media-video" controls preload="none" poster={poster ?? undefined} playsInline width={1280} height={720}>
        <source src={src} />
        <a href={src}>download the video</a>
      </video>
    );
  }
  if (m.type === 'audio' && src) {
    return (
      <Tile kind="audio" name={name}>
        <audio className="media-audio" controls preload="none" src={src} aria-label={`audio: ${name}`} />
      </Tile>
    );
  }
  if (kind === 'oracle') {
    return (
      <Tile kind="oracle" name={String(extra.question ?? item.asked ?? name)}>
        <div className="tile-sub"><span className="tile-k">attested</span> {String(extra.answer ?? 'not exposed')}</div>
      </Tile>
    );
  }
  if (kind === 'heartbeat') {
    return (
      <Tile kind="heartbeat" name={String(extra.label ?? name)}>
        <div className="tile-sub"><span className="tile-k">cadence</span> {String(extra.cadence ?? 'not exposed')}</div>
      </Tile>
    );
  }
  return <Tile kind={kind} name={name} />;
}

export function Card({ item, base, onSelectKind }: { item: GalleryItem; base: string; onSelectKind?: (k: Kind) => void }) {
  const kind = asKind(item.kind);
  const links = item.links ?? {};
  const open = links.site ?? null;
  const cid = links.cid ? `https://ipfs.io/ipfs/${links.cid}/` : null;
  const at = item.at ? item.at.slice(0, 16).replace('T', ' ') + ' UTC' : null;
  return (
    <article className={`card card-${kind}`} aria-labelledby={`t-${item.id ?? item.name}`}>
      <div className="card-media">
        <Glyph kind={kind} onSelect={onSelectKind} />
        <MediaBlock item={item} kind={kind} base={base} />
      </div>
      <div className="card-body">
        <h3 className="card-title" id={`t-${item.id ?? item.name}`}>{item.name ?? 'untitled'}</h3>
        {at ? <p className="card-at">{at}</p> : null}
        {item.asked ? <p className="card-asked">{item.asked}</p> : null}
        {item.built ? <p className="card-built">{item.built}</p> : null}
        <ul className="card-links">
          {open ? <li><a href={open} target="_blank" rel="noopener noreferrer">open {item.name ?? 'site'}</a></li> : null}
          {links.repo ? <li><a href={links.repo} target="_blank" rel="noopener noreferrer">repo</a></li> : null}
          {links.launch ? <li><a href={links.launch} target="_blank" rel="noopener noreferrer">launch record</a></li> : null}
          {links.job ? <li><a href={links.job} target="_blank" rel="noopener noreferrer">job</a></li> : null}
          {links.oracle ? <li><a href={links.oracle} target="_blank" rel="noopener noreferrer">oracle record</a></li> : null}
          {links.schedule ? <li><a href={links.schedule} target="_blank" rel="noopener noreferrer">schedule record</a></li> : null}
          {cid ? <li><a href={cid} target="_blank" rel="noopener noreferrer">ipfs cid</a></li> : null}
        </ul>
      </div>
    </article>
  );
}

export function CommunityCard({ link, onSelectKind }: { link: CommunityLink; onSelectKind?: (k: Kind) => void }) {
  const name = link.name ?? link.url ?? 'community';
  return (
    <article className="card card-community" aria-labelledby={`t-community-${name}`}>
      <div className="card-media">
        <Glyph kind="community" onSelect={onSelectKind} />
        <Tile kind="community" name={name} />
      </div>
      <div className="card-body">
        <h3 className="card-title" id={`t-community-${name}`}>{name}</h3>
        {link.oneLiner ? <p className="card-built">{link.oneLiner}</p> : null}
        <ul className="card-links">
          {link.url ? <li><a href={link.url} target="_blank" rel="noopener noreferrer">open {name}</a></li> : null}
        </ul>
      </div>
    </article>
  );
}
