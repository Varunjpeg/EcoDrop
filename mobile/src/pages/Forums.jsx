import { useState } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const TOPICS = ['All', 'Eco Tips', 'Campus News', 'Challenges', 'General'];

const TOPIC_COLORS = {
  'Eco Tips':    { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
  'Campus News': { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6' },
  'Challenges':  { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  'General':     { bg: 'rgba(139,92,246,0.15)', color: '#8B5CF6' },
};

function timeAgo(str) { return str; } // Already formatted in mock data

function PostCard({ post, onClick }) {
  const { bg, color } = TOPIC_COLORS[post.topic] || { bg: 'var(--surface-2)', color: 'var(--text-3)' };
  return (
    <div onClick={onClick} style={{
      padding: '16px', marginBottom: 10, background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="avatar" style={{ fontSize: 11 }}>{post.author.avatar}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 13 }}>{post.author.name}</p>
          <p style={{ color: 'var(--text-3)', fontSize: 11 }}>{post.author.dept} · {post.timeAgo}</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--radius-full)', background: bg, color }}>{post.topic}</span>
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.4 }}>{post.title}</h3>
      <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {post.body}
      </p>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, color: 'var(--text-3)', fontSize: 13 }}>
        <span>❤️ {post.likes}</span>
        <span>💬 {post.comments}</span>
      </div>
    </div>
  );
}

function PostDetail({ post, onBack, onLike, onComment }) {
  const [comment, setComment] = useState('');
  const { bg, color } = TOPIC_COLORS[post.topic] || { bg: 'var(--surface-2)', color: 'var(--text-3)' };

  return (
    <div>
      <button onClick={onBack} style={{ color: 'var(--text-2)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', marginBottom: 16 }}>
        ← Back to Forums
      </button>

      <div style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar" style={{ fontSize: 11 }}>{post.author.avatar}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700 }}>{post.author.name}</p>
            <p style={{ color: 'var(--text-3)', fontSize: 12 }}>{post.author.dept} · {post.timeAgo}</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--radius-full)', background: bg, color }}>{post.topic}</span>
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.4, marginBottom: 10 }}>{post.title}</h2>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.8, fontSize: 14 }}>{post.body}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={onLike} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-full)',
            background: post.liked ? 'rgba(239,68,68,0.15)' : 'var(--surface-2)', border: `1px solid ${post.liked ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
            color: post.liked ? '#EF4444' : 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            {post.liked ? '❤️' : '🤍'} {post.likes}
          </button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13 }}>
            💬 {post.commentsList?.length || 0} comments
          </span>
        </div>
      </div>

      {/* Comments */}
      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Comments</p>
      {(post.commentsList || []).map(c => (
        <div key={c.id} style={{ padding: '12px', marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
            <div className="avatar" style={{ width: 30, height: 30, fontSize: 10 }}>{c.avatar}</div>
            <div><p style={{ fontWeight: 600, fontSize: 13 }}>{c.author}</p><p style={{ color: 'var(--text-3)', fontSize: 11 }}>{c.timeAgo}</p></div>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>{c.body}</p>
        </div>
      ))}

      {/* Add Comment */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input className="input-plain" value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Write a comment..." style={{ flex: 1 }}
          onKeyDown={e => { if (e.key === 'Enter' && comment.trim()) { onComment(comment.trim()); setComment(''); } }}
        />
        <button className="btn btn-primary btn-sm" onClick={() => { if(comment.trim()) { onComment(comment.trim()); setComment(''); } }}>
          Post
        </button>
      </div>
    </div>
  );
}

function CreatePostModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');
  const [topic, setTopic] = useState('General');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Create Post</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4, display: 'block' }}>Topic</label>
          <div className="chips">
            {['Eco Tips','Campus News','Challenges','General'].map(t => (
              <button key={t} className={`chip ${topic === t ? 'active' : ''}`} onClick={() => setTopic(t)}>{t}</button>
            ))}
          </div>
        </div>
        <input className="input-plain" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title..." style={{ marginBottom: 10, width: '100%' }} />
        <textarea className="input-plain" value={body} onChange={e => setBody(e.target.value)} placeholder="Share your thoughts..." rows={5} style={{ width: '100%', resize: 'none', marginBottom: 16 }} />
        <button className="btn btn-accent btn-full" disabled={!title.trim() || !body.trim()} onClick={() => onCreate({ title, body, topic })} style={{ color: 'var(--text-inv)', fontWeight: 700, padding: '14px', marginBottom: 10 }}>
          Publish Post
        </button>
        <button className="btn btn-outline btn-full" onClick={onClose} style={{ padding: '12px' }}>Cancel</button>
      </div>
    </div>
  );
}

export default function Forums() {
  const { state, dispatch } = useApp();
  const [filter, setFilter]   = useState('All');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const posts = state.forumPosts;
  const filtered = posts.filter(p => filter === 'All' || p.topic === filter);

  const handleCreate = ({ title, body, topic }) => {
    dispatch({
      type: 'ADD_FORUM_POST',
      payload: {
        id: 'p' + Date.now(), topic, likes: 0, comments: 0, timeAgo: 'Just now',
        author: { name: state.user?.name || 'You', dept: state.user?.department || 'CSE', avatar: 'VK' },
        title, body, liked: false, commentsList: [],
      },
    });
    toast.success('Post published! 🌱');
    setShowCreate(false);
  };

  const handleLike = (postId) => dispatch({ type: 'LIKE_POST', payload: postId });

  const handleComment = (postId, text) => {
    dispatch({
      type: 'ADD_COMMENT',
      payload: {
        postId,
        comment: { id: 'c' + Date.now(), author: state.user?.name || 'You', avatar: 'VK', body: text, timeAgo: 'Just now' },
      },
    });
    toast.success('Comment added!');
    // Refresh selected post
    setSelected(posts.find(p => p.id === postId));
  };

  const selectedPost = selected ? posts.find(p => p.id === selected.id) || selected : null;

  return (
    <div style={{ padding: '0 16px' }}>
      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      <div style={{ padding: '52px 4px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {selectedPost
          ? <h1 className="page-header-title" style={{ padding: 0, fontSize: 18 }}>Post</h1>
          : <h1 className="page-header-title" style={{ padding: 0 }}>💬 Community</h1>
        }
        {!selectedPost && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>✏️ Post</button>
        )}
      </div>

      {selectedPost ? (
        <PostDetail post={selectedPost} onBack={() => setSelected(null)} onLike={() => handleLike(selectedPost.id)} onComment={(text) => handleComment(selectedPost.id, text)} />
      ) : (
        <>
          {/* Weekly Challenge Banner */}
          <div style={{ padding: '14px 16px', marginBottom: 16, background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontWeight: 700, color: '#F59E0B', marginBottom: 4 }}>🏆 This Week's Challenge</p>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>Recycle 5 plastic bottles this week! Top 3 get 100 bonus coins.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-gold">3 days left</span>
              <span className="badge badge-orange">+100 Bonus Coins</span>
            </div>
          </div>

          {/* Filters */}
          <div className="chips" style={{ marginBottom: 16 }}>
            {TOPICS.map(t => <button key={t} className={`chip ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>{t}</button>)}
          </div>

          {/* Posts */}
          {filtered.map(post => <PostCard key={post.id} post={post} onClick={() => setSelected(post)} />)}
        </>
      )}

      <div style={{ height: 8 }} />
    </div>
  );
}
