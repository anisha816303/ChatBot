import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormGroup,
  Label,
  Row,
  Col,
  Card,
  CardBody,
  Badge,
} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../argon-design-system-react-master/src/assets/css/argon-design-system-react.css';
import './PromptTemplates.css';

const PromptTemplates = ({ isOpen, onClose, onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchPromptTemplates();
    }
  }, [isOpen]);

  const fetchPromptTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8080/api/prompt-templates', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch prompt templates');
      const data = await response.json();
      setTemplates(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(template => template.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateSelect = (template) => {
    onSelectTemplate(template.content);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" centered className="modern-modal">
      <div className="modal-overlay">
        <ModalHeader toggle={onClose} className="modern-modal-header">
          <div className="modal-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            Prompt Templates
          </div>
        </ModalHeader>
        
        <ModalBody className="modern-modal-body">
          {/* Search and Filter Controls */}
          <div className="search-controls">
            <div className="search-input-container">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="modern-search-input"
              />
            </div>
            
            <div className="category-select-container">
              <Input
                type="select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="modern-select-input"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Input>
            </div>
          </div>

          {/* Content Area */}
          <div className="templates-content">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                <h6>No templates found</h6>
                <p>
                  {searchTerm || selectedCategory !== 'all'
                    ? 'No templates match your search criteria'
                    : 'No templates available'}
                </p>
              </div>
            ) : (
              <div className="templates-grid">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className="template-card"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="template-header">
                      <h5 className="template-title">{template.title}</h5>
                      <Badge className="template-category">{template.category}</Badge>
                    </div>
                    
                    <p className="template-description">{template.description}</p>
                    
                    <div className="template-preview">
                      <div className="preview-label">Preview:</div>
                      <div className="preview-content">
                        {template.content.length > 100
                          ? template.content.substring(0, 100) + '...'
                          : template.content}
                      </div>
                    </div>
                    
                    <div className="template-footer">
                      <span className="template-author">by {template.author || 'Unknown'}</span>
                      <span className="template-usage">Used {template.usageCount || 0} times</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
        
        <ModalFooter className="modern-modal-footer">
          <Button className="cancel-btn" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </div>

     
    </Modal>
  );
};

export default PromptTemplates;