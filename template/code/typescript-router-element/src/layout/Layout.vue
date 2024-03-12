<template>
  <div class="left">
    <el-menu>
      <el-menu-item index="1">首页</el-menu-item>
      <el-menu-item index="2">订单管理</el-menu-item>
      <el-sub-menu index="3">
        <template #title>我的工作台</template>
        <el-menu-item index="3-1">选项1</el-menu-item>
        <el-menu-item index="3-2">选项2</el-menu-item>
        <el-menu-item index="3-3">选项3</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
  <div class="right">
    <div class="right__top">
      <el-menu mode="horizontal">
        <el-menu-item index="1">首页</el-menu-item>
        <el-menu-item index="2">订单管理</el-menu-item>
        <el-sub-menu index="3">
          <template #title>我的工作台</template>
          <el-menu-item index="3-1">选项1</el-menu-item>
          <el-menu-item index="3-2">选项2</el-menu-item>
          <el-menu-item index="3-3">选项3</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    <div class="right__bottom">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMenu, ElSubMenu, ElMenuItem } from 'element-plus'
</script>

<style lang="scss" scoped>
.left {
  width: 200px;
  height: 100%;
  float: left;
}
.right {
  margin-left: 200px;
  background-color: #e9eaec;
  .right__top {
    background-color: #fff;
  }
  .right__bottom {
    padding: 20px;
    background-color: #fff;
  }
}
</style>
