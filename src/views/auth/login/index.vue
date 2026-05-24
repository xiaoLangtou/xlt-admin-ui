<!-- 登录页面 -->
<template>
  <div class="flex w-full h-screen overflow-hidden">
    <!-- 左侧视觉区域 -->
    <LoginLeftView />

    <!-- 右侧表单区域 -->
    <div class="relative flex-1 flex items-center justify-center p-6 lg:p-12">
      <AuthTopBar />

      <!-- 移动端顶部渐变色条 -->
      <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--el-color-primary)] to-[var(--el-color-primary-light-3)] lg:hidden" />

      <div class="auth-right-wrap">
        <div class="form">
          <!-- Logo + 标题区 -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--el-color-primary-light-9)] mb-5">
              <ArtLogo size="36" />
            </div>
            <h3 class="title">{{ $t('login.title') }}</h3>
            <p class="sub-title">{{ $t('login.subTitle') }}</p>
          </div>

          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            :key="formKey"
            class="form-fields"
            @keyup.enter="handleSubmit"
          >
            <!-- 账号 -->
            <ElFormItem prop="username">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.username')"
                v-model.trim="formData.username"
                autocomplete="username"
              >
                <template #prefix>
                  <ArtSvgIcon icon="ri:user-line" class="text-base text-g-500" />
                </template>
              </ElInput>
            </ElFormItem>

            <!-- 密码 -->
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                :placeholder="$t('login.placeholder.password')"
                v-model.trim="formData.password"
                type="password"
                autocomplete="current-password"
                show-password
              >
                <template #prefix>
                  <ArtSvgIcon icon="ri:lock-line" class="text-base text-g-500" />
                </template>
              </ElInput>
            </ElFormItem>

            <!-- 验证码 -->
            <ElFormItem prop="captcha">
              <div class="flex gap-3 w-full items-center">
                <ElInput
                  class="custom-height flex-1"
                  placeholder="请输入验证码"
                  v-model.trim="formData.captcha"
                  autocomplete="off"
                >
                  <template #prefix>
                    <ArtSvgIcon icon="ri:shield-keyhole-line" class="text-base text-g-500" />
                  </template>
                </ElInput>
                <div
                  class="shrink-0 h-[40px] w-[120px] rounded-lg overflow-hidden border border-[var(--el-border-color)] cursor-pointer transition-all hover:border-[var(--el-color-primary)] hover:shadow-sm relative"
                  @click="loadCaptcha"
                >
                  <img
                    v-if="captchaImage"
                    :src="captchaImage"
                    alt="验证码"
                    class="w-full h-full object-cover"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center bg-[var(--el-fill-color-light)] text-xs text-g-400 gap-1"
                  >
                    <ArtSvgIcon icon="ri:refresh-line" class="text-sm animate-spin" />
                    获取中
                  </div>
                  <div
                    v-if="captchaExpired"
                    class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] text-white z-10 gap-1"
                  >
                    <ArtSvgIcon icon="ri:error-warning-line" class="text-base text-orange-400" />
                    <span class="text-xs">点击刷新</span>
                  </div>
                </div>
              </div>
            </ElFormItem>

            <!-- 记住密码 / 忘记密码 -->
            <div class="flex-cb text-sm">
              <ElCheckbox v-model="formData.rememberPassword">{{
                $t('login.rememberPwd')
              }}</ElCheckbox>
              <RouterLink class="text-theme" :to="{ name: 'ForgetPassword' }">{{
                $t('login.forgetPwd')
              }}</RouterLink>
            </div>

            <!-- 登录按钮 -->
            <div class="mt-6">
              <ElButton
                class="w-full custom-height login-btn"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>

          
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { fetchLogin, fetchCaptcha } from '@/api/auth'
  import { ElNotification, type FormInstance, type FormRules } from 'element-plus'

  defineOptions({ name: 'Login' })

  const { t, locale } = useI18n()
  const formKey = ref(0)

  // 监听语言切换，重置表单
  watch(locale, () => {
    formKey.value++
  })

  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()

  const systemName = AppConfig.systemInfo.name
  const formRef = ref<FormInstance>()

  const formData = reactive({
    username: '',
    password: '',
    captcha: '',
    captchaId: '',
    rememberPassword: true
  })

  const rules = computed<FormRules>(() => ({
    username: [{ required: true, message: t('login.placeholder.username'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.placeholder.password'), trigger: 'blur' }],
    captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
  }))

  const loading = ref(false)

  // 验证码
  const captchaImage = ref('')
  const captchaExpired = ref(false)
  let captchaTimer: ReturnType<typeof setTimeout> | null = null
  const CAPTCHA_EXPIRE_MS = 60_000

  const loadCaptcha = async () => {
    captchaExpired.value = false
    captchaImage.value = ''
    if (captchaTimer) clearTimeout(captchaTimer)
    try {
      const data = await fetchCaptcha()
      formData.captchaId = data.captchaId
      captchaImage.value = data.captcha.startsWith('data:')
        ? data.captcha
        : `data:image/png;base64,${data.captcha}`
      captchaTimer = setTimeout(() => {
        captchaExpired.value = true
      }, CAPTCHA_EXPIRE_MS)
    } catch {
      captchaImage.value = ''
    }
  }

  onMounted(() => {
    loadCaptcha()
  })

  onUnmounted(() => {
    if (captchaTimer) clearTimeout(captchaTimer)
  })

  // 登录
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      const valid = await formRef.value.validate()
      if (!valid) return

      loading.value = true

      const { username, password, captcha, captchaId } = formData
      const { accessToken, refreshToken, userInfo } = await fetchLogin({
        username,
        password,
        captcha,
        captchaId
      })

      if (!accessToken) {
        throw new Error('Login failed - no token received')
      }

      userStore.setToken(accessToken, refreshToken)
      if (userInfo) {
        userStore.setUserInfo({
          userId: userInfo.id,
          userName: userInfo.username,
          email: userInfo.email ?? '',
          avatar: userInfo.headPic,
          nickname: userInfo.nickname,
          roles: Array.isArray(userInfo.roles) ? userInfo.roles.map(String) : [],
          buttons: userInfo.permissions ?? []
        })
      }
      userStore.setLoginStatus(true)
      showLoginSuccessNotice()

      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    } catch (error) {
      if (!(error instanceof HttpError)) {
        console.error('[Login] Unexpected error:', error)
      }
      formData.captcha = ''
      await loadCaptcha()
    } finally {
      loading.value = false
    }
  }

  // 登录成功提示
  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      })
    }, 1000)
  }
</script>

<style scoped>
  @import './style.css';
</style>
