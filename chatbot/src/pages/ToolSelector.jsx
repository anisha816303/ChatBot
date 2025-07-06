import React, { useState } from 'react';
import { Card, CardBody, Button, Form, FormGroup, Input, Label, Row, Col, Badge } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../argon-design-system-react-master/src/assets/css/argon-design-system-react.css';

const ToolSelector = ({ tools, prompt, onConfirm, onResample }) => {
  const [selected, setSelected] = useState({});

  const toggle = (toolName) => {
    setSelected(prev => {
      const updated = { ...prev };
      if (updated[toolName]) {
        delete updated[toolName];
      } else {
        updated[toolName] = { order: Object.keys(prev).length + 1 };
      }
      return updated;
    });
  };

  const updateOrder = (toolName, order) => {
    setSelected(prev => ({
      ...prev,
      [toolName]: { ...prev[toolName], order: parseInt(order) }
    }));
  };

  const handleConfirm = () => {
    const orderedTools = Object.entries(selected)
      .filter(([_, val]) => val?.order != null)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([name]) => name);

    onConfirm(orderedTools);
  };

  return (
    <Card className="shadow border-0 mb-4">
      <CardBody>
        <h5 className="text-primary font-weight-bold mb-3">Select tools and specify order of execution</h5>
        <Form>
          {tools.map(tool => {
            const isChecked = selected.hasOwnProperty(tool.name);
            return (
              <FormGroup key={tool.name} check className="mb-3">
                <Label check className="d-flex align-items-center">
                  <Input
                    type="checkbox"
                    id={tool.name}
                    checked={isChecked}
                    onChange={() => toggle(tool.name)}
                    className="mr-2"
                  />
                  <span className="font-weight-bold mr-2">{tool.name}</span>
                  <span className="text-muted">{tool.description}</span>
                  {isChecked && (
                    <Input
                      type="number"
                      min="1"
                      value={selected[tool.name]?.order || ''}
                      onChange={e => updateOrder(tool.name, e.target.value)}
                      className="ml-3"
                      style={{ width: 60 }}
                      placeholder="Order"
                    />
                  )}
                </Label>
              </FormGroup>
            );
          })}
        </Form>
        <Row className="mt-4">
          <Col xs="auto">
            <Button color="primary" onClick={handleConfirm} className="mr-2">Confirm</Button>
            <Button color="info" outline onClick={onResample}>Resample</Button>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

export default ToolSelector;