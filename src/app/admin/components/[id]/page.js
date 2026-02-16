'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Form, Input, Select, Switch, Space, message, Spin, Collapse, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Rich Text', value: 'richtext' },
  { label: 'Image', value: 'image' },
  { label: 'Video', value: 'video' },
  { label: 'Number', value: 'number' },
  { label: 'Select', value: 'select' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Repeater', value: 'repeater' },
];

export default function ComponentEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchComponent();
  }, [id]);

  const fetchComponent = async () => {
    try {
      const res = await fetch(`/api/admin/components/${id}`);
      if (!res.ok) throw new Error('Component not found');
      const data = await res.json();
      setComponent(data);
      setFields(data.propsSchema || []);
      form.setFieldsValue({
        displayName: data.displayName,
        category: data.category,
      });
    } catch {
      message.error('Failed to load component');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const res = await fetch(`/api/admin/components/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: values.displayName,
          category: values.category,
          propsSchema: fields,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      message.success('Component saved');
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    setFields([...fields, {
      fieldName: '',
      label: '',
      type: 'text',
      required: false,
      defaultValue: '',
      options: [],
      fields: [],
    }]);
  };

  const removeField = (index) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const updateField = (index, key, value) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const addOption = (fieldIndex) => {
    const newFields = [...fields];
    const options = [...(newFields[fieldIndex].options || []), { label: '', value: '' }];
    newFields[fieldIndex] = { ...newFields[fieldIndex], options };
    setFields(newFields);
  };

  const updateOption = (fieldIndex, optionIndex, key, value) => {
    const newFields = [...fields];
    const options = [...(newFields[fieldIndex].options || [])];
    options[optionIndex] = { ...options[optionIndex], [key]: value };
    newFields[fieldIndex] = { ...newFields[fieldIndex], options };
    setFields(newFields);
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const newFields = [...fields];
    const options = [...(newFields[fieldIndex].options || [])];
    options.splice(optionIndex, 1);
    newFields[fieldIndex] = { ...newFields[fieldIndex], options };
    setFields(newFields);
  };

  const addSubField = (fieldIndex) => {
    const newFields = [...fields];
    const subFields = [...(newFields[fieldIndex].fields || []), {
      fieldName: '',
      label: '',
      type: 'text',
      required: false,
    }];
    newFields[fieldIndex] = { ...newFields[fieldIndex], fields: subFields };
    setFields(newFields);
  };

  const updateSubField = (fieldIndex, subIndex, key, value) => {
    const newFields = [...fields];
    const subFields = [...(newFields[fieldIndex].fields || [])];
    subFields[subIndex] = { ...subFields[subIndex], [key]: value };
    newFields[fieldIndex] = { ...newFields[fieldIndex], fields: subFields };
    setFields(newFields);
  };

  const removeSubField = (fieldIndex, subIndex) => {
    const newFields = [...fields];
    const subFields = [...(newFields[fieldIndex].fields || [])];
    subFields.splice(subIndex, 1);
    newFields[fieldIndex] = { ...newFields[fieldIndex], fields: subFields };
    setFields(newFields);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}><Spin size="large" /></div>;
  }

  if (component?.type === 'system') {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/components')} style={{ marginBottom: '16px' }}>
          Back
        </Button>
        <Card title={component.displayName}>
          <p><strong>Type:</strong> System (read-only)</p>
          <p><strong>Category:</strong> {component.category}</p>
          <p><strong>Base Component:</strong> {component.baseComponent}</p>
          <h4>Props Schema ({component.propsSchema?.length || 0} fields):</h4>
          <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', overflow: 'auto' }}>
            {JSON.stringify(component.propsSchema, null, 2)}
          </pre>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/components')}>Back</Button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            Edit: {component?.displayName}
          </h1>
        </Space>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
          Save
        </Button>
      </div>

      {/* Basic Info */}
      <Card title="Component Info" style={{ marginBottom: '16px' }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="displayName" label="Display Name">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="category" label="Category">
                <Select options={[
                  { label: 'Layout', value: 'layout' },
                  { label: 'Content', value: 'content' },
                  { label: 'Marketing', value: 'marketing' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Schema Builder */}
      <Card
        title={`Props Schema (${fields.length} fields)`}
        extra={<Button icon={<PlusOutlined />} onClick={addField}>Add Field</Button>}
      >
        {fields.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>No fields defined. Click "Add Field" to create the component schema.</p>
        ) : (
          <Collapse
            items={fields.map((field, index) => ({
              key: String(index),
              label: (
                <span>
                  <strong>{field.label || `Field ${index + 1}`}</strong>
                  {field.fieldName && <code style={{ marginLeft: '8px', color: '#999' }}>{field.fieldName}</code>}
                  <span style={{ marginLeft: '8px', color: '#999' }}>[{field.type}]</span>
                  {field.required && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
                </span>
              ),
              extra: (
                <Popconfirm title="Remove this field?" onConfirm={(e) => { e?.stopPropagation(); removeField(index); }}>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                </Popconfirm>
              ),
              children: (
                <div>
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item label="Field Name (camelCase)">
                        <Input value={field.fieldName} onChange={(e) => updateField(index, 'fieldName', e.target.value)} placeholder="e.g., bannerTitle" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label="Label">
                        <Input value={field.label} onChange={(e) => updateField(index, 'label', e.target.value)} placeholder="e.g., Banner Title" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={4}>
                      <Form.Item label="Type">
                        <Select value={field.type} onChange={(val) => updateField(index, 'type', val)} options={FIELD_TYPES} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={4}>
                      <Form.Item label="Required">
                        <Switch checked={field.required} onChange={(val) => updateField(index, 'required', val)} />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Select Options */}
                  {field.type === 'select' && (
                    <div style={{ marginTop: '16px', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>Select Options</strong>
                        <Button size="small" icon={<PlusOutlined />} onClick={() => addOption(index)}>Add Option</Button>
                      </div>
                      {(field.options || []).map((opt, optIdx) => (
                        <Row key={optIdx} gutter={8} style={{ marginBottom: '8px' }}>
                          <Col xs={10}>
                            <Input placeholder="Label" value={opt.label} onChange={(e) => updateOption(index, optIdx, 'label', e.target.value)} />
                          </Col>
                          <Col xs={10}>
                            <Input placeholder="Value" value={opt.value} onChange={(e) => updateOption(index, optIdx, 'value', e.target.value)} />
                          </Col>
                          <Col xs={4}>
                            <Button danger icon={<DeleteOutlined />} onClick={() => removeOption(index, optIdx)} />
                          </Col>
                        </Row>
                      ))}
                    </div>
                  )}

                  {/* Repeater Sub-Fields */}
                  {field.type === 'repeater' && (
                    <div style={{ marginTop: '16px', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>Sub-Fields</strong>
                        <Button size="small" icon={<PlusOutlined />} onClick={() => addSubField(index)}>Add Sub-Field</Button>
                      </div>
                      {(field.fields || []).map((sub, subIdx) => (
                        <Row key={subIdx} gutter={8} style={{ marginBottom: '8px' }}>
                          <Col xs={7}>
                            <Input placeholder="Field Name" value={sub.fieldName} onChange={(e) => updateSubField(index, subIdx, 'fieldName', e.target.value)} />
                          </Col>
                          <Col xs={7}>
                            <Input placeholder="Label" value={sub.label} onChange={(e) => updateSubField(index, subIdx, 'label', e.target.value)} />
                          </Col>
                          <Col xs={6}>
                            <Select value={sub.type} onChange={(val) => updateSubField(index, subIdx, 'type', val)} options={FIELD_TYPES.filter((t) => t.value !== 'repeater')} style={{ width: '100%' }} />
                          </Col>
                          <Col xs={4}>
                            <Button danger icon={<DeleteOutlined />} onClick={() => removeSubField(index, subIdx)} />
                          </Col>
                        </Row>
                      ))}
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}
