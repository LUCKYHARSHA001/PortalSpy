import React, { useState } from 'react';
import { Filter as FilterIcon, Plus, X, Save, Check } from 'lucide-react';

export default function FilterConfig({ filter, onSaveFilters }) {
  const [includeTerms, setIncludeTerms] = useState(filter?.includeTerms || []);
  const [excludeTerms, setExcludeTerms] = useState(filter?.excludeTerms || []);
  const [locations, setLocations] = useState(filter?.locations || []);

  const [inputInclude, setInputInclude] = useState('');
  const [inputExclude, setInputExclude] = useState('');
  const [inputLocation, setInputLocation] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddTag = (type, value, setValue, list, setList) => {
    if (!value.trim()) return;
    if (!list.includes(value.trim())) {
      setList([...list, value.trim()]);
    }
    setValue('');
  };

  const handleRemoveTag = (term, list, setList) => {
    setList(list.filter((t) => t !== term));
  };

  const handleSave = async () => {
    await onSaveFilters({ includeTerms, excludeTerms, locations });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="section-header">
        <h2 className="section-title">
          <FilterIcon size={20} color="var(--accent-cyan)" />
          Keyword & Location Filter Rules
        </h2>
        <button className="btn btn-primary" onClick={handleSave}>
          {savedSuccess ? <Check size={18} /> : <Save size={18} />}
          {savedSuccess ? 'Filters Saved!' : 'Save Filter Configuration'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Title Inclusion Terms */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Role Title Inclusion Keywords (Must match at least one term)
          </label>
          <div className="tag-container">
            {includeTerms.map((term) => (
              <span key={term} className="tag" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
                {term}
                <span className="tag-remove" onClick={() => handleRemoveTag(term, includeTerms, setIncludeTerms)}>
                  <X size={14} />
                </span>
              </span>
            ))}
            <input
              type="text"
              className="form-input"
              placeholder="Add keyword (e.g. React, Frontend) + Enter"
              value={inputInclude}
              onChange={(e) => setInputInclude(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('include', inputInclude, setInputInclude, includeTerms, setIncludeTerms))}
              style={{ border: 'none', background: 'transparent', flex: 1, minWidth: '180px', padding: '0.2rem' }}
            />
          </div>
        </div>

        {/* Title Exclusion Terms */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Exclusion Keywords (Automatically filter out matching roles)
          </label>
          <div className="tag-container">
            {excludeTerms.map((term) => (
              <span key={term} className="tag" style={{ border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185' }}>
                {term}
                <span className="tag-remove" onClick={() => handleRemoveTag(term, excludeTerms, setExcludeTerms)}>
                  <X size={14} />
                </span>
              </span>
            ))}
            <input
              type="text"
              className="form-input"
              placeholder="Add term (e.g. Senior Lead, Director) + Enter"
              value={inputExclude}
              onChange={(e) => setInputExclude(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('exclude', inputExclude, setInputExclude, excludeTerms, setExcludeTerms))}
              style={{ border: 'none', background: 'transparent', flex: 1, minWidth: '180px', padding: '0.2rem' }}
            />
          </div>
        </div>

        {/* Location Parameters */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Target Location Parameters
          </label>
          <div className="tag-container">
            {locations.map((loc) => (
              <span key={loc} className="tag" style={{ border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c084fc' }}>
                {loc}
                <span className="tag-remove" onClick={() => handleRemoveTag(loc, locations, setLocations)}>
                  <X size={14} />
                </span>
              </span>
            ))}
            <input
              type="text"
              className="form-input"
              placeholder="Add location (e.g. Remote, India, Hybrid) + Enter"
              value={inputLocation}
              onChange={(e) => setInputLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag('location', inputLocation, setInputLocation, locations, setLocations))}
              style={{ border: 'none', background: 'transparent', flex: 1, minWidth: '180px', padding: '0.2rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
