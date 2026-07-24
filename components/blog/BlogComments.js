"use client";

import { useState, useEffect } from "react";
import { Row, Col, message } from "antd";
import {
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import styled from "styled-components";

const CommentsSection = styled.div`
  margin-top: 48px;
  padding-top: 32px;
  border-top: 2px solid rgba(0, 0, 0, 0.06);
  .comments-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .comment-item {
    padding: 20px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    &:last-child {
      border-bottom: none;
    }
  }
  .comment-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .comment-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(0, 0, 0, 0.3);
    font-size: 16px;
    flex-shrink: 0;
  }
  .comment-name {
    font-size: 15px;
    font-weight: 600;
  }
  .comment-date {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .comment-text {
    font-size: 15px;
    line-height: 1.6;
    color: rgba(0, 0, 0, 0.7);
    margin-left: 46px;
  }
`;

const CommentForm = styled.div`
  margin-top: 40px;
  padding-top: 32px;
  border-top: 2px solid rgba(0, 0, 0, 0.06);
  .form-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .form-desc {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.45);
    margin-bottom: 24px;
  }
  .form-field {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    background: #fff;
    box-sizing: border-box;
    transition: border-color 0.2s;
    &:focus {
      border-color: rgba(0, 0, 0, 0.3);
    }
    &::placeholder {
      color: rgba(0, 0, 0, 0.3);
    }
  }
  textarea.form-field {
    resize: vertical;
    min-height: 120px;
  }
  .form-group {
    margin-bottom: 16px;
  }
  .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 14px;
  }
  .req {
    color: #E03C33;
  }
  .error-text {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.4;
    color: #E03C33;
  }
`;

const SubmitBtn = styled.button`
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: var(--blog-post-button-bg, var(--primary-color, #8b1a1a));
  color: var(--blog-post-button-text, #fff);
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogComments({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch(`/api/public/blogs/${slug}/comments`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!email.trim()) nextErrors.email = "Email is required";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Please enter a valid email address";
    if (!comment.trim()) nextErrors.comment = "Comment is required";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/blogs/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        message.success(data.message || "Comment submitted for approval");
        setName("");
        setEmail("");
        setComment("");
        setErrors({});
      } else {
        message.error(data.error || "Failed to submit");
      }
    } catch {
      message.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="comments">
      <CommentsSection>
        <div className="comments-title">
          <MessageOutlined /> {comments.length} Comment
          {comments.length !== 1 ? "s" : ""}
        </div>
        {loading ? (
          <div style={{ color: "rgba(0,0,0,0.35)", padding: "16px 0" }}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ color: "rgba(0,0,0,0.35)", padding: "16px 0" }}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="comment-item">
              <div className="comment-header">
                <div className="comment-avatar">
                  <UserOutlined />
                </div>
                <div>
                  <div className="comment-name">{c.name}</div>
                  <div className="comment-date">
                    <ClockCircleOutlined /> {timeAgo(c.createdAt)}
                  </div>
                </div>
              </div>
              <div className="comment-text">{c.comment}</div>
            </div>
          ))
        )}
      </CommentsSection>

      <CommentForm>
        <div className="form-title">Leave a Comment</div>
        <p className="form-desc">
          Your email address will not be published. Required fields are marked *
        </p>
        <form onSubmit={handleSubmit}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <div className="form-group">
                <label className="form-label">
                  Name <span className="req">*</span>
                </label>
                <input
                  className="form-field"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  required
                  style={errors.name ? { borderColor: "#E03C33" } : undefined}
                />
                {errors.name ? <div className="error-text">{errors.name}</div> : null}
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="form-group">
                <label className="form-label">
                  Email <span className="req">*</span>
                </label>
                <input
                  className="form-field"
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  required
                  style={errors.email ? { borderColor: "#E03C33" } : undefined}
                />
                {errors.email ? <div className="error-text">{errors.email}</div> : null}
              </div>
            </Col>
          </Row>
          <div className="form-group">
            <label className="form-label">
              Comment <span className="req">*</span>
            </label>
            <textarea
              className="form-field"
              placeholder="Write your comment..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (errors.comment) setErrors((prev) => ({ ...prev, comment: "" }));
              }}
              required
              style={errors.comment ? { borderColor: "#E03C33" } : undefined}
            />
            {errors.comment ? <div className="error-text">{errors.comment}</div> : null}
          </div>
          <SubmitBtn type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Post Comment"}
          </SubmitBtn>
        </form>
      </CommentForm>
    </div>
  );
}
