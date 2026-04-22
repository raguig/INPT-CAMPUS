"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClubPost, ClubMemberRole } from "@/lib/clubs-types";
import { POST_TYPE_COLORS, POST_TYPE_LABELS } from "@/lib/clubs-types";

type PostCardProps = {
  post: ClubPost;
  showClub?: boolean;
  onLike?: (postId: number) => void;
};

const ROLE_LABELS: Record<ClubMemberRole, string> = {
  president: "Président",
  vice_president: "Vice-Président",
  officer: "Officier",
  member: "Membre",
};

export function PostCard({ post, showClub = false, onLike }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.likes_count);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    onLike?.(post.id);
  };

  const isLong = post.content.length > 280;
  const ts = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });

  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary">
          {post.author_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{post.author_name}</span>
            {post.author_role !== "member" && (
              <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[post.author_role]}</Badge>
            )}
            <span className="text-xs text-slate-400">· {ts}</span>
          </div>
          {showClub && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[10px]">🎯</span> {post.club_name}
            </div>
          )}
        </div>
        <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", POST_TYPE_COLORS[post.post_type])}>
          {POST_TYPE_LABELS[post.post_type]}
        </span>
      </div>

      <div className="mt-3.5">
        <h3 className="text-base font-semibold text-slate-900">{post.title}</h3>
        <p className={cn("mt-1.5 text-sm leading-relaxed text-slate-600", !expanded && isLong && "line-clamp-3")}>{post.content}</p>
        {isLong && (
          <button type="button" onClick={() => setExpanded(!expanded)} className="mt-1 text-xs font-medium text-primary hover:underline">
            {expanded ? "Voir moins" : "Voir plus"}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
        <button type="button" onClick={handleLike} className={cn("flex items-center gap-1.5 text-sm transition-colors", liked ? "font-semibold text-red-500" : "text-slate-400 hover:text-red-400")}>
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {likeCount}
        </button>
      </div>
    </div>
  );
}
