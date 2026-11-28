'use client';

import type { CSSProperties } from 'react';
import type { PlayerView } from '@/lib/game-types';
import { councilIdentity, PHASE_LABELS } from '@/lib/council-display';
import { COURT } from '@/lib/roles-content';

interface CouncilSeat { userId: string; name: string; isHost: boolean }
interface Props {
  players: CouncilSeat[];
  view: PlayerView | null;
  viewerId: string;
  onlinePlayers: Record<string, boolean>;
  speakingIds: string[];
}

export function RoundTokens({ view }: { view: PlayerView }) {
  return (
    <ol className="round-medallions" aria-label="Battle round results">
      {[1, 2, 3, 4, 5].map(round => {
        const result = view.game.roundResults.find(r => r.round === round);
        const state = result?.winner === 'GREEN' ? 'loyal' : result ? 'traitor' : view.game.round === round ? 'current' : 'pending';
        return <li key={round} className={`round-medallion round-medallion--${state}`} title={`Round ${round}: ${result?.winner === 'GREEN' ? 'Nawab’s Loyalists' : result ? 'East India Company' : state === 'current' ? 'In progress' : 'Pending'}`}>
          <span aria-hidden="true">{result ? result.winner === 'GREEN' ? '✓' : '✕' : round}</span>
          <span className="sr-only">Round {round}: {result?.winner ?? state}</span>
        </li>;
      })}
    </ol>
  );
}

export function CouncilTable({ players, view, viewerId, onlinePlayers, speakingIds }: Props) {
  const phase = view?.game.phase ?? 'LOBBY';
  const seats = view ? view.game.players.map(p => ({
    userId: p.id,
    name: players.find(player => player.userId === p.id)?.name ?? `Seat ${p.seat + 1}`,
    isHost: players.some(player => player.userId === p.id && player.isHost),
  })) : players;
  const leaderId = view?.game.players.find(p => p.seat === view.game.leaderSeat)?.id;
  const leader = seats.find(p => p.userId === leaderId);
  const green = view?.game.roundResults.filter(r => r.winner === 'GREEN').length ?? 0;
  const red = view?.game.roundResults.filter(r => r.winner === 'RED').length ?? 0;

  return <section className="council-stage" aria-label="The Plassey council table">
    <div className="council-caption">
      <span className="council-kicker">Plassey · 23 June 1757</span>
      <h2>The secret council</h2>
      <span className="council-kicker">{seats.length} seats occupied</span>
    </div>
    <div className="council-board" data-dense={seats.length > 10}>
      <div className="council-rim" aria-hidden="true" />
      <div className="council-core">
        <span className="council-kicker">{view ? `Round ${view.game.round} · Attempt ${view.game.attempt}` : 'The court of Bengal'}</span>
        <h3>{PHASE_LABELS[phase] ?? phase.replaceAll('_', ' ').toLowerCase()}</h3>
        {view ? <>
          <RoundTokens view={view} />
          <div className="council-score"><span className="text-loyal">{green} Loyalist</span><span className="opacity-40">/</span><span className="text-traitor">{red} Company</span></div>
          <div className="council-rejections" aria-label={`${view.game.failTrack} rejected nominations out of 5`}>
            {[1, 2, 3, 4, 5].map(n => <i key={n} data-rejected={n <= view.game.failTrack} />)}
          </div>
          <span className="council-metadata">{view.game.failTrack}/5 rejections</span>
        </> : <><div className="council-seal" aria-hidden="true">17<span>57</span></div><p className="council-metadata">Awaiting the host’s orders</p></>}
      </div>
      {seats.map((p, index) => {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(seats.length, 6);
        const position = { '--seat-x': `${50 + Math.cos(angle) * 39}%`, '--seat-y': `${50 + Math.sin(angle) * 39}%` } as CSSProperties;
        const identity = councilIdentity(view, p.userId);
        const character = COURT.find(r => r.id === identity);
        const isLeader = p.userId === leaderId;
        const isMinister = view?.game.ministerIds.includes(p.userId) ?? false;
        const hasActed = view?.game.votedIds.includes(p.userId) || view?.game.playedIds.includes(p.userId);
        return <div key={p.userId} className="council-seat" style={position} data-me={p.userId === viewerId} data-leader={isLeader} data-speaking={speakingIds.includes(p.userId)}>
          <div className={`seat-portrait ${character ? `seat-portrait--${character.team.toLowerCase()}` : ''}`}>
            {character?.portrait ? <img src={character.portrait} alt={character.name} /> : <span className="seat-hidden" aria-label="Secret identity">?</span>}
            {isLeader && <span className="seat-crown" title="Council leader" aria-label="Council leader">♛</span>}
            <span className="seat-connection" data-online={onlinePlayers[p.userId] !== false} title={onlinePlayers[p.userId] === false ? 'Disconnected' : 'Connected'} />
            {isMinister && <span className="seat-minister" title="Selected minister" aria-label="Selected minister">◆</span>}
          </div>
          <span className="seat-name" title={p.name}>{index + 1}. {p.name}{p.userId === viewerId ? ' · you' : ''}</span>
          {hasActed && <span className="seat-voted">✓ Submitted</span>}
        </div>;
      })}
    </div>
    <div className="council-footer"><span>{leader ? `♛ ${leader.name} leads the council` : 'Roles remain secret until dealt'}</span><span>{view ? `${view.game.teamSize} ministers required` : '6–15 players'}</span></div>
    {seats.length > 10 && <ol className="dense-seat-list">{seats.map((p, i) => <li key={p.userId}>{i + 1}. {p.name}{p.userId === viewerId ? ' · you' : ''}</li>)}</ol>}
  </section>;
}
