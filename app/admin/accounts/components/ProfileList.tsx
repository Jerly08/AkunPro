import { FiChevronRight, FiUser, FiUserX } from 'react-icons/fi';
import { NetflixProfile } from '@prisma/client';

interface ProfileListProps {
  profiles: NetflixProfile[];
}

const ProfileList = ({ profiles }: ProfileListProps) => {
  if (!profiles || profiles.length === 0) {
    return (
      <div className="py-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <FiUserX className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">Belum ada profil</h3>
        <p className="text-sm text-gray-500">
          Klik tombol "Tambah Profil" untuk membuat profil baru
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {profiles.map((profile) => (
          <li key={profile.id} className="py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{profile.name}</h4>
                    <p className="text-xs text-gray-500">
                      {profile.isKids ? 'Profil Anak' : 'Profil Standar'}
                      {profile.pin && ' • PIN: ' + profile.pin}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {profile.userId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Digunakan
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Tersedia
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="ml-2">
                <button 
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  title="Lihat Detail"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProfileList; 