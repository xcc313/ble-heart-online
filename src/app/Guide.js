import React, { useState } from 'react';
import './Guide.css'; 

const guidePages = [
  {
    image: '/guide/1.BMP',
    title: '欢迎使用以Garmin255为例',
    description: '进入[心率监测功能](其他支持HRS的设备也可以)',
  },
  {
    image: '/guide/2.BMP',
    title: '心率推送',
    description: '选择[心率推送]并按下开始按钮'
  },
  {
    image: '/guide/3.BMP',
    title: 'Web端实时同步',
    description: '确保PC的蓝牙已经和手表配对成功'
  },
];

export default function Guide({ guide , endGuide }) {

  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = guidePages.length;
  const isLastPage = currentPage === totalPages - 1;
  const isFirstPage = currentPage === 0;

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSkip = () => {
    setCurrentPage(totalPages - 1); // 跳转到最后一页
  };

  const handleComplete = () => {
    endGuide()
  };

  const currentData = guidePages[currentPage];


  return (
    guide && <div className="onboarding-container">
      {/* 图标与文字内容 */}
      <div className="content-wrapper">
        {/* 图片 */}
        <div className="image-frame">
          <img
            src={currentData.image}
            alt={`引导图 ${currentPage + 1}`}
            className="guide-image"
          />
        </div>

        {/* 文字描述 */}
        <div className="text-content">
          <h2 className="title">{currentData.title}</h2>
          <p className="description">{currentData.description}</p>
        </div>
      </div>

      {/* 指示器 */}
      <div className="dots-container">
        {guidePages.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentPage ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* 按钮区域 */}
      <div className="button-container">
        {!isFirstPage && (
          <button className="btn btn-skip" onClick={handlePrev}>
            上一步
          </button>
        )}

        <button className="btn btn-next" onClick={handleNext}>
          {isLastPage ? '完成' : '下一步'}
        </button>
      </div>
    </div>
  );
};