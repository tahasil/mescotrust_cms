"use client";

import { useSearchParams } from "next/navigation";
import { Row, Col, Result, Button } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { PageContainer } from "@/styles/Theme";
import Link from "next/link";

export default function DonationSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") || "";

  return (
    <PageContainer $managedStyle={{ paddingTop: 60, paddingBottom: 60 }}>
      <Row justify="center">
        <Col xs={24} md={16} lg={12}>
          <Result
            icon={<CheckCircleFilled style={{ color: "#52c41a", fontSize: 64 }} />}
            title="Thank You for Your Donation!"
            subTitle={
              <>
                Your payment was successful.
                {orderId && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#888" }}>
                    Order ID: {orderId}
                  </div>
                )}
              </>
            }
            extra={[
              <Link key="home" href="/">
                <Button type="primary" size="large">Back to Home</Button>
              </Link>,
            ]}
          />
        </Col>
      </Row>
    </PageContainer>
  );
}
