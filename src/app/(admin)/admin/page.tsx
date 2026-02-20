import Link from "next/link";
import { Card, Row, Col, Statistic } from "antd";
import { FileTextOutlined, UserOutlined, MailOutlined, BookOutlined } from "@ant-design/icons";
import { connectDB } from "@/lib/db";
import { Page, User, BlogPost, ContactSubmission } from "@/models";

export default async function AdminDashboardPage() {
  await connectDB();
  const [pageCount, userCount, postCount, contactCount] = await Promise.all([
    Page.countDocuments(),
    User.countDocuments(),
    BlogPost.countDocuments(),
    ContactSubmission.countDocuments(),
  ]);

  const links = [
    { href: "/admin/pages", label: "Pages", icon: <FileTextOutlined />, count: pageCount },
    { href: "/admin/users", label: "Users", icon: <UserOutlined />, count: userCount },
    { href: "/admin/contacts", label: "Contacts", icon: <MailOutlined />, count: contactCount },
    { href: "/admin/blogs", label: "Blog posts", icon: <BookOutlined />, count: postCount },
  ];

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Dashboard</h2>
      <Row gutter={[16, 16]}>
        {links.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.href}>
            <Link href={item.href}>
              <Card hoverable>
                <Statistic
                  title={item.label}
                  value={item.count}
                  prefix={item.icon}
                />
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
