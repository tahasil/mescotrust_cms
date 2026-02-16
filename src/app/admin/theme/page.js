'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Row, Col, message, Spin, ColorPicker } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export default function ThemeSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const res = await fetch('/api/admin/theme');
      const data = await res.json();
      form.setFieldsValue({
        mode: data.mode || 'light',
        primaryColor: data.primaryColor || '#CF372F',
        secondaryColor: data.secondaryColor || '#691C18',
        fontFamily: data.fontFamily || 'Inter',
        fontSizeBase: data.fontSize?.base || '16px',
        fontSizeHeading: data.fontSize?.heading || '36px',
        layoutWidth: data.layoutWidth || '1400px',
      });
    } catch {
      message.error('Failed to load theme');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const body = {
        mode: values.mode,
        primaryColor: typeof values.primaryColor === 'string' ? values.primaryColor : values.primaryColor?.toHexString?.() || '#CF372F',
        secondaryColor: typeof values.secondaryColor === 'string' ? values.secondaryColor : values.secondaryColor?.toHexString?.() || '#691C18',
        fontFamily: values.fontFamily,
        fontSize: {
          base: values.fontSizeBase,
          heading: values.fontSizeHeading,
        },
        layoutWidth: values.layoutWidth,
      };

      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      message.success('Theme settings saved');
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Theme Settings</h1>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="Colors" style={{ marginBottom: '16px' }}>
              <Form.Item name="mode" label="Mode">
                <Select options={[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                ]} />
              </Form.Item>
              <Form.Item name="primaryColor" label="Primary Color">
                <Input placeholder="#CF372F" />
              </Form.Item>
              <Form.Item name="secondaryColor" label="Secondary Color">
                <Input placeholder="#691C18" />
              </Form.Item>
            </Card>

            <Card title="Preview" style={{ marginBottom: '16px' }}>
              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.primaryColor !== cur.primaryColor || prev.secondaryColor !== cur.secondaryColor}>
                {() => (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      background: form.getFieldValue('primaryColor') || '#CF372F',
                    }} />
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      background: form.getFieldValue('secondaryColor') || '#691C18',
                    }} />
                    <div style={{
                      width: '120px',
                      height: '60px',
                      borderRadius: '8px',
                      background: `linear-gradient(90deg, ${form.getFieldValue('primaryColor') || '#CF372F'} 0%, ${form.getFieldValue('secondaryColor') || '#691C18'} 100%)`,
                    }} />
                  </div>
                )}
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Typography" style={{ marginBottom: '16px' }}>
              <Form.Item name="fontFamily" label="Font Family">
                <Select options={[
                  { label: 'Inter', value: 'Inter' },
                  { label: 'Roboto', value: 'Roboto' },
                  { label: 'Open Sans', value: 'Open Sans' },
                  { label: 'Poppins', value: 'Poppins' },
                  { label: 'Lato', value: 'Lato' },
                  { label: 'Montserrat', value: 'Montserrat' },
                ]} />
              </Form.Item>
              <Form.Item name="fontSizeBase" label="Base Font Size">
                <Select options={[
                  { label: '14px', value: '14px' },
                  { label: '16px', value: '16px' },
                  { label: '18px', value: '18px' },
                ]} />
              </Form.Item>
              <Form.Item name="fontSizeHeading" label="Heading Font Size">
                <Select options={[
                  { label: '28px', value: '28px' },
                  { label: '32px', value: '32px' },
                  { label: '36px', value: '36px' },
                  { label: '42px', value: '42px' },
                ]} />
              </Form.Item>
            </Card>

            <Card title="Layout">
              <Form.Item name="layoutWidth" label="Max Content Width">
                <Select options={[
                  { label: '1200px', value: '1200px' },
                  { label: '1400px', value: '1400px' },
                  { label: '1600px', value: '1600px' },
                  { label: 'Full Width', value: '100%' },
                ]} />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
