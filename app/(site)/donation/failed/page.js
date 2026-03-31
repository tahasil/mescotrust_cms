"use client";

import { useSearchParams } from "next/navigation";
import { Row, Col, Result, Button } from "antd";
import { CloseCircleFilled } from "@ant-design/icons";
import { PageContainer } from "@/styles/Theme";
import Link from "next/link";

export default function DonationFailedPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") || "";
  const status = searchParams.get("status") || "failed";

  const title = status === "aborted"
    ? "Payment Cancelled"
    : "Payment Failed";

  const subTitle = status === "aborted"
    ? "You cancelled the payment. No amount has been charged."
    : "Something went wrong with your payment. Please try again.";

  return (
    <PageContainer style={{ paddingTop: 60, paddingBottom: 60 }}>
      <Row justify="center">
        <Col xs={24} md={16} lg={12}>
          <Result
            icon={<CloseCircleFilled style={{ color: "#ff4d4f", fontSize: 64 }} />}
            title={title}
            subTitle={
              <>
                {subTitle}
                {orderId && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#888" }}>
                    Order ID: {orderId}
                  </div>
                )}
              </>
            }
            extra={[
              <Link key="retry" href="/donate">
                <Button type="primary" size="large">Try Again</Button>
              </Link>,
              <Link key="home" href="/">
                <Button size="large">Back to Home</Button>
              </Link>,
            ]}
          />
        </Col>
      </Row>
    </PageContainer>
  );
}
