"use client";

import Link from "next/link";
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  InsertRowAboveOutlined,
  NotificationOutlined,
  InsertRowBelowOutlined,
  MenuOutlined,
  RobotOutlined,
  ShareAltOutlined,
  FormOutlined,
  SlidersOutlined,
  BorderOutlined,
  BellOutlined,
  TeamOutlined,
  CommentOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  CalendarOutlined,
  InboxOutlined,
  SettingOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  ReadOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { ADMIN_MODULE_GUIDES } from "@/lib/documentation/adminGuidesData";

const { Title, Text, Paragraph } = Typography;

const ICON_MAP = {
  DashboardOutlined: <DashboardOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  InsertRowAboveOutlined: <InsertRowAboveOutlined />,
  NotificationOutlined: <NotificationOutlined />,
  InsertRowBelowOutlined: <InsertRowBelowOutlined />,
  MenuOutlined: <MenuOutlined />,
  RobotOutlined: <RobotOutlined />,
  ShareAltOutlined: <ShareAltOutlined />,
  FormOutlined: <FormOutlined />,
  SlidersOutlined: <SlidersOutlined />,
  BorderOutlined: <BorderOutlined />,
  BellOutlined: <BellOutlined />,
  TeamOutlined: <TeamOutlined />,
  CommentOutlined: <CommentOutlined />,
  PictureOutlined: <PictureOutlined />,
  QuestionCircleOutlined: <QuestionCircleOutlined />,
  BookOutlined: <BookOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  InboxOutlined: <InboxOutlined />,
  SettingOutlined: <SettingOutlined />,
  UserOutlined: <UserOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  FolderOpenOutlined: <FolderOpenOutlined />,
};

function getModuleIcon(iconName) {
  return ICON_MAP[iconName] || <ReadOutlined />;
}

export default function DocumentationHub() {
  return (
    <div style={{ padding: "8px 0 50px 0" }}>
      {/* Modules Cards Grid */}
      <Row gutter={[20, 20]}>
        {ADMIN_MODULE_GUIDES.map((module) => (
          <Col xs={24} sm={12} lg={8} key={module.id}>
            <Card
              hoverable
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                transition: "all 0.2s ease-in-out",
              }}
              bodyStyle={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div>
                {/* Card Top Icon & Badges */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: "#e6f4ff",
                      color: "#1677ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {getModuleIcon(module.icon)}
                  </div>
                  <Tag color="blue" style={{ margin: 0 }}>
                    {module.badge}
                  </Tag>
                </div>

                {/* Card Title & Category */}
                <Title level={4} style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 600 }}>
                  <Link href={`/admin/documentation/${module.id}`} style={{ color: "inherit" }}>
                    {module.documentTitle || module.title}
                  </Link>
                </Title>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 10 }}>
                  {module.categoryLabel} • {module.adminRoute}
                </Text>

                {/* Summary */}
                <Paragraph
                  ellipsis={{ rows: 3 }}
                  style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5, marginBottom: 14 }}
                >
                  {module.summary}
                </Paragraph>
              </div>

              {/* Bottom Actions */}
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 14, marginTop: "auto" }}>
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Link href={`/admin/documentation/${module.id}`}>
                    <Button type="primary" ghost size="middle">
                      Read Guide →
                    </Button>
                  </Link>

                  <Link href={module.adminRoute}>
                    <Tooltip title={`Open ${module.title} in Admin`}>
                      <Button size="middle" icon={<LinkOutlined />}>
                        Open
                      </Button>
                    </Tooltip>
                  </Link>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
