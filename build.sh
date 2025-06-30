#!/usr/bin/env bash

# Production Docker Image Build Script
# This script builds a production-ready Docker image for x86 architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="typescript-next-template"
IMAGE_TAG="${1:-latest}"
PLATFORM="linux/amd64"  # x86 architecture
DOCKERFILE="Dockerfile"
BUILD_TARGET="production"

echo -e "${GREEN}🔨 Building Production Docker Image${NC}"
echo -e "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo -e "Platform: ${PLATFORM}"
echo -e "Target: ${BUILD_TARGET}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}❌ Dockerfile not found in current directory${NC}"
    exit 1
fi

# Build the Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build \
    --platform="${PLATFORM}" \
    --target="${BUILD_TARGET}" \
    --tag="${IMAGE_NAME}:${IMAGE_TAG}" \
    --file="${DOCKERFILE}" \
    .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
    echo -e "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
    echo ""
    echo -e "${GREEN}🚀 To run the production container:${NC}"
    echo -e "docker run -p 3000:3000 \\"
    echo -e "  --env-file .env \\"
    echo -e "  ${IMAGE_NAME}:${IMAGE_TAG}"
    echo ""
    echo -e "${GREEN}💾 To save the image as a tar file:${NC}"
    echo -e "docker save ${IMAGE_NAME}:${IMAGE_TAG} -o ${IMAGE_NAME}-${IMAGE_TAG}.tar"
    echo ""
    echo -e "${GREEN}🚢 To push to a registry:${NC}"
    echo -e "docker tag ${IMAGE_NAME}:${IMAGE_TAG} <registry>/${IMAGE_NAME}:${IMAGE_TAG}"
    echo -e "docker push <registry>/${IMAGE_NAME}:${IMAGE_TAG}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi