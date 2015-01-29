// pxCore CopyRight 2007-2015 John Robinson
// pxImage.cpp

#include "rtString.h"
#include "rtRefT.h"
#include "pxCore.h"
#include "pxOffscreen.h"
#include "pxUtil.h"
#include "pxScene2d.h"

#include "pxImage.h"

#include "pxContext.h"

extern pxContext context;

rtError pxImage::url(rtString& s) const { s = mURL; return RT_OK; }
rtError pxImage::setURL(const char* s) { 
  mURL = s;
  if (pxLoadImage(s, mOffscreen) != RT_OK)
    printf("image load failed\n");
  else
    printf("image %d, %d\n", mOffscreen.width(), mOffscreen.height());
  mw = mOffscreen.width();
  mh = mOffscreen.height();
  return RT_OK;
}

void pxImage::draw() {
  context.drawImage(mOffscreen.width(), mOffscreen.height(), mOffscreen);
}

rtDefineObject(pxImage, pxObject);
rtDefineProperty(pxImage, url);