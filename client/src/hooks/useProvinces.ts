import { useEffect, useState } from 'react'

export interface Province {
  name: string
  code: number
  codename: string
  division_type: string
  phone_code: number
  districts: District[]
}

export interface District {
  name: string
  code: number
  codename: string
  division_type: string
  province_code: number
  wards: Ward[]
}

export interface Ward {
  name: string
  code: number
  codename: string
  division_type: string
  district_code: number
  short_codename?: string
}

export const useProvinces = () => {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('/data/provinces.json')
        const data = await response.json()
        setProvinces(data)
      } catch (error) {
        console.error('Failed to load provinces:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProvinces()
  }, [])

  // Lấy danh sách quận/huyện theo tỉnh
  const getDistrictsByProvince = (provinceCode: number): District[] => {
    const province = provinces.find(p => p.code === provinceCode)
    return province?.districts || []
  }

  // Lấy danh sách phường/xã theo quận
  const getWardsByDistrict = (districtCode: number): Ward[] => {
    for (const province of provinces) {
      const district = province.districts?.find(d => d.code === districtCode)
      if (district) {
        return district.wards || []
      }
    }
    return []
  }

  // Legacy function - lấy wards theo province code (tìm wards của quận đầu tiên)
  const getWardsByProvince = (provinceCode: number): Ward[] => {
    const province = provinces.find(p => p.code === provinceCode)
    if (province?.districts && province.districts.length > 0) {
      return province.districts[0].wards || []
    }
    return []
  }

  return { provinces, loading, getDistrictsByProvince, getWardsByDistrict, getWardsByProvince }
}
