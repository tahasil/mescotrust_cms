import Link from "next/link";
import { Card, Row, Col, Statistic } from "antd";
import { FileTextOutlined, BookOutlined, MailOutlined } from "@ant-design/icons";
import { connectDB } from "@/lib/db";
import Page from "@/models/Page";
import Blog from "@/models/Blog";
import ContactSubmission from "@/models/ContactSubmission";

async function getCounts() {
  try {
    await connectDB();
    const [pages, posts, contacts] = await Promise.all([
      Page.countDocuments(),
      Blog.countDocuments(),
      ContactSubmission.countDocuments(),
    ]);
    return { pages, posts, contacts };
  } catch {
    return { pages: 0, posts: 0, contacts: 0 };
  }
}

export default async function AdminDashboardPage() {
  const { pages, posts, contacts } = await getCounts();

  return (
    <>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Link href="/admin/pages">
            <Card>
              <Statistic title="Pages" value={pages} prefix={<FileTextOutlined />} />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={8}>
          <Link href="/admin/blogs">
            <Card>
              <Statistic title="Blog posts" value={posts} prefix={<BookOutlined />} />
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={8}>
          <Link href="/admin/contacts">
            <Card>
              <Statistic title="Contact submissions" value={contacts} prefix={<MailOutlined />} />
            </Card>
          </Link>
        </Col>
      </Row>
    </>
  );
}
