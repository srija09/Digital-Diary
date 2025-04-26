import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchNotes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched notes:', response.data); // Debug log
      setNotes(response.data);
      setError('');
    } catch (err) {
      console.error('Fetch notes error:', err);
      setError('Failed to fetch notes');
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (editId) {
        if (!editId) throw new Error('No editId set');
        console.log('Updating note with ID:', editId); // Debug log
        await axios.put(`http://localhost:5000/api/notes/${editId}`, {
          title,
          content
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/notes', {
          title,
          content
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setTitle('');
      setContent('');
      setEditId(null);
      setError('');
      fetchNotes();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.error || 'Failed to save note');
    }
  };

  const handleEdit = (note) => {
    console.log('Editing note:', note); // Debug log
    if (!note._id) {
      setError('Invalid note ID');
      return;
    }
    setTitle(note.title);
    setContent(note.content);
    setEditId(note._id);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!id) {
      setError('Invalid note ID');
      return;
    }
    console.log('Deleting note with ID:', id); // Debug log
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setError('');
      fetchNotes();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete note');
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setEditId(null);
    setError('');
  };

  return (
    <div className="notes-container">
      <h2 className="notes-title">My Notes</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit} className="notes-form">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="form-button">
            {editId ? 'Update Note' : 'Add Note'}
          </button>
          {editId && (
            <button type="button" className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
      <div>
        {notes.map((note) => (
          <div key={note._id} className="note-card">
            <h3 className="note-title">{note.title}</h3>
            <p className="note-content">{note.content}</p>
            <button
              onClick={() => handleEdit(note)}
              className="note-button edit"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(note._id)}
              className="note-button delete"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notes;