import type { WorldCupGroupTeam } from '../../types';

interface GroupStageProps {
  groups: { name: string; teams: WorldCupGroupTeam[] }[];
}

export default function GroupStage({ groups }: GroupStageProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-office-brown/40">Les groupes seront disponibles au tirage au sort.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {groups.map((group) => (
        <div key={group.name} className="card overflow-hidden">
          <div className="bg-office-navy px-4 py-2.5">
            <h3 className="text-white font-bold text-sm">{group.name}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-office-paper/50 text-office-brown/50 text-xs">
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Equipe</th>
                  <th className="text-center px-2 py-2">J</th>
                  <th className="text-center px-2 py-2">V</th>
                  <th className="text-center px-2 py-2">N</th>
                  <th className="text-center px-2 py-2">D</th>
                  <th className="text-center px-2 py-2">DB</th>
                  <th className="text-center px-2 py-2 font-bold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.teams
                  .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
                  .map((entry, idx) => (
                    <tr
                      key={entry.team.code}
                      className={`border-t border-office-paper-dark/40 ${
                        idx < 2 ? 'bg-office-green/5' : idx === 2 ? 'bg-office-mustard/5' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-office-brown/40 font-medium">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {entry.team.flag && (
                            <img src={entry.team.flag} alt="" className="w-5 h-4 object-cover rounded-sm" />
                          )}
                          <span className="font-medium text-office-navy">{entry.team.name}</span>
                          <span className="text-[10px] text-office-brown/30">{entry.team.code}</span>
                        </div>
                      </td>
                      <td className="text-center px-2 py-2 text-office-brown/60">{entry.played}</td>
                      <td className="text-center px-2 py-2 text-office-green">{entry.wins}</td>
                      <td className="text-center px-2 py-2 text-office-brown/40">{entry.draws}</td>
                      <td className="text-center px-2 py-2 text-office-red">{entry.losses}</td>
                      <td className="text-center px-2 py-2 text-office-brown/60">
                        {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                      </td>
                      <td className="text-center px-2 py-2 font-bold text-office-navy">{entry.points}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Legende */}
          <div className="px-3 py-1.5 bg-office-paper/30 flex gap-3 text-[10px] text-office-brown/40">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-office-green/30 rounded-sm" /> Qualifie
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-office-mustard/30 rounded-sm" /> Barrage
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
