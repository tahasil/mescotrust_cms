'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Row, Col, Card, Button, Input, Select, Switch, Form, message, Spin, Collapse,
  Drawer, InputNumber, Tabs, Tag, Popconfirm, Space, Tooltip,
} from 'antd';
import {
  SaveOutlined, EyeOutlined, PlusOutlined, DeleteOutlined,
  HolderOutlined, ArrowUpOutlined, ArrowDownOutlined,
  CheckCircleOutlined, EditOutlined,
} from '@ant-design/icons';
import slugify from 'slugify';

export default function PageBuilderPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === 'new';

  const [page, setPage] = useState(null);
  const [components, setComponents] = useState([]);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    Promise.all([fetchPage(), fetchComponents()]).then(() => setLoading(false));
  }, [id]);

  const fetchPage = async () => {
    if (isNew) {
      setPage({ title: '', slug: '', status: 'draft', metaTitle: '', metaDescription: '', layout: [] });
      setLayout([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/pages/${id}`);
      if (!res.ok) throw new Error('Page not found');
      const data = await res.json();
      setPage(data);

      // When populated from API, componentId is the full component object.
      // Normalize so componentDefinition is always set and componentId is a plain string ID.
      const normalizedLayout = (data.layout || []).map((item) => {
        if (item.componentId && typeof item.componentId === 'object') {
          return {
            ...item,
            componentDefinition: item.componentId,
            componentId: item.componentId._id,
          };
        }
        return item;
      });
      setLayout(normalizedLayout);

      form.setFieldsValue({
        title: data.title,
        slug: data.slug,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        status: data.status,
      });
    } catch {
      message.error('Failed to load page');
    }
  };

  const fetchComponents = async () => {
    try {
      const res = await fetch('/api/admin/components?active=true');
      const data = await res.json();
      setComponents(data || []);
    } catch {
      message.error('Failed to load components');
    }
  };

  const handleSave = async (status) => {
    try {
      await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const body = {
        title: values.title,
        slug: values.slug || slugify(values.title, { lower: true, strict: true }),
        metaTitle: values.metaTitle || values.title,
        metaDescription: values.metaDescription,
        status: status || values.status || 'draft',
        layout: layout.map((item, index) => ({
          componentId: item.componentId,
          componentType: item.componentType,
          props: item.props || {},
          order: index,
          isEnabled: item.isEnabled !== false,
        })),
      };

      const url = isNew ? '/api/admin/pages' : `/api/admin/pages/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const savedPage = await res.json();
      message.success(status === 'published' ? 'Page published!' : 'Page saved!');

      if (isNew) {
        router.replace(`/admin/pages/${savedPage._id}`);
      } else {
        setPage(savedPage);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addComponent = (component) => {
    const newItem = {
      componentId: component._id,
      componentType: component.type,
      props: { ...(component.defaultProps || {}) },
      order: layout.length,
      isEnabled: true,
      componentDefinition: component,
    };
    setLayout([...layout, newItem]);
    setSelectedItemIndex(layout.length);
    setDrawerOpen(false);
    message.success(`${component.displayName} added`);
  };

  const removeComponent = (index) => {
    const newLayout = [...layout];
    newLayout.splice(index, 1);
    setLayout(newLayout);
    if (selectedItemIndex === index) setSelectedItemIndex(null);
    if (selectedItemIndex > index) setSelectedItemIndex(selectedItemIndex - 1);
  };

  const moveComponent = (index, direction) => {
    const newLayout = [...layout];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;
    [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
    setLayout(newLayout);
    setSelectedItemIndex(targetIndex);
  };

  const toggleComponent = (index) => {
    const newLayout = [...layout];
    newLayout[index] = { ...newLayout[index], isEnabled: !newLayout[index].isEnabled };
    setLayout(newLayout);
  };

  const updateComponentProps = (index, fieldName, value) => {
    const newLayout = [...layout];
    newLayout[index] = {
      ...newLayout[index],
      props: { ...newLayout[index].props, [fieldName]: value },
    };
    setLayout(newLayout);
  };

  const getComponentDefinition = (item) => {
    if (item.componentDefinition) return item.componentDefinition;
    const cid = typeof item.componentId === 'object' ? item.componentId._id : item.componentId;
    return components.find((c) => c._id === cid);
  };

  const renderPropsEditor = (index) => {
    const item = layout[index];
    if (!item) return null;

    const definition = getComponentDefinition(item);
    if (!definition) return <p>Component definition not found</p>;

    const schema = definition.propsSchema || [];
    if (schema.length === 0) return <p style={{ color: '#999' }}>This component has no configurable props.</p>;

    return (
      <div>
        <h4 style={{ marginBottom: '16px' }}>{definition.displayName} - Properties</h4>
        {schema.map((field) => renderFieldEditor(field, item.props?.[field.fieldName], (value) => {
          updateComponentProps(index, field.fieldName, value);
        }))}
      </div>
    );
  };

  const renderFieldEditor = (field, value, onChange) => {
    const label = (
      <span>
        {field.label}
        {field.required && <span style={{ color: 'red' }}> *</span>}
      </span>
    );

    switch (field.type) {
      case 'text':
        return (
          <Form.Item key={field.fieldName} label={label}>
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </Form.Item>
        );

      case 'richtext':
        return (
          <Form.Item key={field.fieldName} label={label}>
            <Input.TextArea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              rows={4}
              placeholder={`Enter ${field.label.toLowerCase()} (HTML supported)`}
            />
          </Form.Item>
        );

      case 'image':
        return (
          <Form.Item key={field.fieldName} label={label}>
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Image URL (e.g., /uploads/2026/01/image.jpg)"
            />
            {value && (
              <img
                src={value}
                alt="Preview"
                style={{ marginTop: '8px', maxHeight: '120px', borderRadius: '8px' }}
              />
            )}
          </Form.Item>
        );

      case 'video':
        return (
          <Form.Item key={field.fieldName} label={label}>
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="YouTube or Vimeo URL"
            />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item key={field.fieldName} label={label}>
            <InputNumber
              value={value}
              onChange={onChange}
              style={{ width: '100%' }}
            />
          </Form.Item>
        );

      case 'select':
        return (
          <Form.Item key={field.fieldName} label={label}>
            <Select
              value={value}
              onChange={onChange}
              options={(field.options || []).map((opt) => ({ label: opt.label, value: opt.value }))}
            />
          </Form.Item>
        );

      case 'boolean':
        return (
          <Form.Item key={field.fieldName} label={label}>
            <Switch checked={!!value} onChange={onChange} />
          </Form.Item>
        );

      case 'repeater':
        return renderRepeaterEditor(field, value || [], onChange);

      default:
        return (
          <Form.Item key={field.fieldName} label={label}>
            <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />
          </Form.Item>
        );
    }
  };

  const renderRepeaterEditor = (field, items, onChange) => {
    const subFields = field.fields || [];

    const addItem = () => {
      const newItem = {};
      subFields.forEach((f) => { newItem[f.fieldName] = ''; });
      onChange([...items, newItem]);
    };

    const removeItem = (index) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      onChange(newItems);
    };

    const updateItem = (index, fieldName, value) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [fieldName]: value };
      onChange(newItems);
    };

    return (
      <div key={field.fieldName} style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <strong>{field.label}</strong>
          <Button size="small" icon={<PlusOutlined />} onClick={addItem}>
            Add Item
          </Button>
        </div>
        <Collapse
          items={items.map((item, index) => ({
            key: String(index),
            label: `Item ${index + 1}${item.name || item.title ? ': ' + (item.name || item.title) : ''}`,
            extra: (
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => { e.stopPropagation(); removeItem(index); }}
              />
            ),
            children: (
              <div>
                {subFields.map((subField) => renderFieldEditor(
                  subField,
                  item[subField.fieldName],
                  (value) => updateItem(index, subField.fieldName, value)
                ))}
              </div>
            ),
          }))}
          size="small"
        />
      </div>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}><Spin size="large" /></div>;
  }

  const systemComponents = components.filter((c) => c.type === 'system');
  const customComponents = components.filter((c) => c.type === 'custom');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          {isNew ? 'Create Page' : `Edit: ${page?.title}`}
        </h1>
        <Space>
          <Button onClick={() => handleSave('draft')} loading={saving} icon={<SaveOutlined />}>
            Save Draft
          </Button>
          <Button type="primary" onClick={() => handleSave('published')} loading={saving} icon={<CheckCircleOutlined />}>
            Publish
          </Button>
          {!isNew && page?.status === 'published' && (
            <Button icon={<EyeOutlined />} href={`/${page.slug}`} target="_blank">
              Preview
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left: Page settings + Layout */}
        <Col xs={24} lg={16}>
          {/* Page Settings */}
          <Card title="Page Settings" style={{ marginBottom: '16px' }}>
            <Form form={form} layout="vertical" initialValues={page}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                    <Input
                      placeholder="Page title"
                      onChange={(e) => {
                        if (isNew || !page?.slug) {
                          form.setFieldValue('slug', slugify(e.target.value, { lower: true, strict: true }));
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                    <Input addonBefore="/" placeholder="page-slug" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="metaTitle" label="Meta Title">
                    <Input placeholder="SEO title" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="status" label="Status">
                    <Select options={[{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }]} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="metaDescription" label="Meta Description">
                    <Input.TextArea rows={2} placeholder="SEO description" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* Layout Builder */}
          <Card
            title={`Page Layout (${layout.length} components)`}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>Add Component</Button>}
          >
            {layout.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <AppstoreOutlinedIcon />
                <p>No components added yet. Click "Add Component" to start building.</p>
              </div>
            ) : (
              <div>
                {layout.map((item, index) => {
                  const def = getComponentDefinition(item);
                  return (
                    <div
                      key={item._id || index}
                      onClick={() => setSelectedItemIndex(index)}
                      style={{
                        padding: '12px 16px',
                        marginBottom: '8px',
                        border: `2px solid ${selectedItemIndex === index ? '#CF372F' : '#f0f0f0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: !item.isEnabled ? '#fafafa' : '#fff',
                        opacity: item.isEnabled ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <HolderOutlined style={{ color: '#999', cursor: 'grab' }} />
                        <div>
                          <strong>{def?.displayName || 'Unknown'}</strong>
                          <Tag style={{ marginLeft: '8px' }} color={item.componentType === 'system' ? 'blue' : 'purple'}>
                            {item.componentType}
                          </Tag>
                          {!item.isEnabled && <Tag color="red">Disabled</Tag>}
                        </div>
                      </div>
                      <Space>
                        <Tooltip title="Move Up">
                          <Button size="small" icon={<ArrowUpOutlined />} onClick={(e) => { e.stopPropagation(); moveComponent(index, -1); }} disabled={index === 0} />
                        </Tooltip>
                        <Tooltip title="Move Down">
                          <Button size="small" icon={<ArrowDownOutlined />} onClick={(e) => { e.stopPropagation(); moveComponent(index, 1); }} disabled={index === layout.length - 1} />
                        </Tooltip>
                        <Tooltip title={item.isEnabled ? 'Disable' : 'Enable'}>
                          <Switch size="small" checked={item.isEnabled !== false} onChange={() => toggleComponent(index)} />
                        </Tooltip>
                        <Popconfirm title="Remove this component?" onConfirm={() => removeComponent(index)}>
                          <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                        </Popconfirm>
                      </Space>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Right: Props Editor */}
        <Col xs={24} lg={8}>
          <Card
            title="Component Properties"
            style={{ position: 'sticky', top: '88px' }}
          >
            {selectedItemIndex !== null && selectedItemIndex < layout.length ? (
              renderPropsEditor(selectedItemIndex)
            ) : (
              <p style={{ color: '#999', textAlign: 'center' }}>
                Select a component from the layout to edit its properties.
              </p>
            )}
          </Card>
        </Col>
      </Row>

      {/* Component Palette Drawer */}
      <Drawer
        title="Add Component"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
      >
        <Tabs
          items={[
            {
              key: 'system',
              label: `System (${systemComponents.length})`,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {systemComponents.map((comp) => (
                    <Card
                      key={comp._id}
                      size="small"
                      hoverable
                      onClick={() => addComponent(comp)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{comp.displayName}</strong>
                          <br />
                          <small style={{ color: '#999' }}>{comp.category} | {comp.propsSchema?.length || 0} props</small>
                        </div>
                        <PlusOutlined style={{ color: '#CF372F', fontSize: '18px' }} />
                      </div>
                    </Card>
                  ))}
                </div>
              ),
            },
            {
              key: 'custom',
              label: `Custom (${customComponents.length})`,
              children: customComponents.length === 0 ? (
                <p style={{ color: '#999' }}>No custom components created yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customComponents.map((comp) => (
                    <Card
                      key={comp._id}
                      size="small"
                      hoverable
                      onClick={() => addComponent(comp)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{comp.displayName}</strong>
                          <br />
                          <small style={{ color: '#999' }}>{comp.category} | {comp.propsSchema?.length || 0} props</small>
                        </div>
                        <PlusOutlined style={{ color: '#722ed1', fontSize: '18px' }} />
                      </div>
                    </Card>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Drawer>
    </div>
  );
}

function AppstoreOutlinedIcon() {
  return <div style={{ fontSize: '48px', color: '#ddd', marginBottom: '16px' }}>&#9638;</div>;
}
